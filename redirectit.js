/**
 * redirectit.js — server-side redirect to a Wappler project page (routes.json).
 * Node Server Connect only.
 *
 * For API / XHR requests: sets $redirect on the JSON response (companion routes hook
 * navigates the browser — no per-form Success handlers).
 * For full-page requests: HTTP redirect (res.redirect).
 */

const fs = require('fs');
const path = require('path');

const ROUTES_FILE = path.resolve('app/config/routes.json');
const REDIRECT_STATUS = 302;

let routeIndexCache = null;
let routeIndexMtime = 0;

/**
 * @param {import('express').Request} req
 * @returns {boolean}
 */
function isApiRequest(req) {
    if (!req) return false;

    const pathInfo = String(
        req.path ||
        req.originalUrl ||
        (req.url && req.url.split('?')[0]) ||
        ''
    );

    if (pathInfo.includes('/api/')) {
        return true;
    }

    const accept = String((req.headers && req.headers.accept) || '').toLowerCase();
    if (accept.includes('application/json')) {
        return true;
    }

    if (req.headers && req.headers['x-requested-with'] === 'XMLHttpRequest') {
        return true;
    }

    return false;
}

/**
 * @param {string} base
 * @param {string} suffix
 * @returns {string}
 */
function appendQuery(base, suffix) {
    const query = String(suffix || '').trim();
    if (!query) return base;

    const normalized = query.startsWith('?') ? query.slice(1) : query;
    if (!normalized) return base;

    const joiner = base.includes('?') ? '&' : '?';
    return base + joiner + normalized;
}

/**
 * @param {Array<object>} routes
 * @param {string} parentPath
 * @param {{ byPath: Map<string, string>, byPage: Map<string, string>, byView: Map<string, string> }} index
 */
function walkRoutes(routes, parentPath, index) {
    for (const route of routes || []) {
        if (!route || !route.path) continue;

        let routePath = route.path;
        if (parentPath) {
            routePath = parentPath + route.path;
        }

        if (route.page) {
            const page = String(route.page).replace(/^\//, '');
            index.byPage.set(page, routePath);
            index.byPage.set(page.toLowerCase(), routePath);

            const viewKeys = [
                '/views/' + page + '.ejs',
                'views/' + page + '.ejs',
                page + '.ejs'
            ];
            for (const key of viewKeys) {
                index.byView.set(key, routePath);
                index.byView.set(key.toLowerCase(), routePath);
            }

            index.byPath.set(routePath, routePath);
            index.byPath.set(routePath.toLowerCase(), routePath);
        }

        if (route.redirect) {
            index.byPath.set(routePath, String(route.redirect));
            index.byPath.set(routePath.toLowerCase(), String(route.redirect));
        }

        if (Array.isArray(route.routes)) {
            walkRoutes(route.routes, routePath, index);
        }
    }
}

function getRouteIndex() {
    if (!fs.existsSync(ROUTES_FILE)) {
        return { byPath: new Map(), byPage: new Map(), byView: new Map() };
    }

    const mtime = fs.statSync(ROUTES_FILE).mtimeMs;
    if (routeIndexCache && mtime === routeIndexMtime) {
        return routeIndexCache;
    }

    const index = {
        byPath: new Map(),
        byPage: new Map(),
        byView: new Map()
    };

    try {
        const { routes } = JSON.parse(fs.readFileSync(ROUTES_FILE, 'utf8'));
        walkRoutes(routes, '', index);
    } catch (err) {
        // routes.json missing or invalid
    }

    routeIndexCache = index;
    routeIndexMtime = mtime;
    return index;
}

function _resetRouteIndex() {
    routeIndexCache = null;
    routeIndexMtime = 0;
}

/**
 * @param {string} raw
 * @returns {string|null}
 */
function resolvePageUrl(raw) {
    const value = String(raw || '').trim();
    if (!value) return null;

    if (/^https?:\/\//i.test(value)) {
        return value;
    }

    const index = getRouteIndex();
    const lower = value.toLowerCase();

    if (index.byPath.has(value)) return index.byPath.get(value);
    if (index.byPath.has(lower)) return index.byPath.get(lower);

    if (value.startsWith('/views/') || value.startsWith('views/')) {
        const fromView = index.byView.get(value) || index.byView.get(lower);
        if (fromView) return fromView;
    }

    if (value.startsWith('/')) {
        return value;
    }

    const fromPage = index.byPage.get(value) || index.byPage.get(lower);
    if (fromPage) return fromPage;

    if (value.endsWith('.ejs')) {
        const base = value.replace(/^\/?views\//, '').replace(/\.ejs$/i, '');
        const fromEjs = index.byPage.get(base) || index.byPage.get(base.toLowerCase());
        if (fromEjs) return fromEjs;
    }

    return '/' + value.replace(/^\/+/, '');
}

/**
 * @param {object} options
 */
exports.page = function (options) {
    const mode = this.parseOptional(options.mode, 'string', 'page');

    let url;
    if (mode === 'url') {
        url = this.parseRequired(options.url, 'string', 'redirectit.page: url is required.');
    } else {
        const page = this.parseRequired(options.page, 'string', 'redirectit.page: page is required.');
        url = resolvePageUrl(page);
        if (!url) {
            throw new Error('redirectit.page: could not resolve page to a route in app/config/routes.json.');
        }
    }

    url = appendQuery(url, this.parseOptional(options.query, 'string', ''));

    if (isApiRequest(this.req)) {
        this.data.$redirect = url;
        return;
    }

    this.res.redirect(REDIRECT_STATUS, url);
};

exports._appendQuery = appendQuery;
exports._resolvePageUrl = resolvePageUrl;
exports._resetRouteIndex = _resetRouteIndex;
exports._getRouteIndex = getRouteIndex;
exports._isApiRequest = isApiRequest;
