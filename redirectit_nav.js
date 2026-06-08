/**
 * Redirect-IT navigation hook — install to extensions/server_connect/routes/redirectit_nav.js
 *
 * Injects a one-time listener via res.send (Wappler EJS resolves then sends HTML).
 * Do not patch res.render — Wappler's async callback expects a Promise, not a string.
 */

const NAV_MARKER = 'data-redirectit-nav';

// Split </script> so the HTML parser cannot close the tag early.
const INLINE_SCRIPT =
    '<script ' + NAV_MARKER + '>\n' +
    '(function () {\n' +
    '  function safeUrl(raw) {\n' +
    '    if (typeof raw !== "string") return null;\n' +
    '    var url = raw.trim();\n' +
    '    if (!url) return null;\n' +
    '    if (url.charAt(0) === "/" && url.charAt(1) !== "/") return url;\n' +
    '    if (/^https?:\\/\\//i.test(url)) {\n' +
    '      try {\n' +
    '        var u = new URL(url, window.location.origin);\n' +
    '        if (u.origin === window.location.origin) {\n' +
    '          return u.pathname + u.search + u.hash;\n' +
    '        }\n' +
    '      } catch (e) {}\n' +
    '    }\n' +
    '    return null;\n' +
    '  }\n' +
    '  function findUrl(response) {\n' +
    '    if (!response || typeof response !== "object") return null;\n' +
    '    if (response.$redirect) return safeUrl(response.$redirect);\n' +
    '    return null;\n' +
    '  }\n' +
    '  function go(url) {\n' +
    '    if (typeof dmx !== "undefined" && dmx.app && typeof dmx.app.find === "function") {\n' +
    '      var browser = dmx.app.find("browser");\n' +
    '      if (browser && typeof browser.goto === "function") {\n' +
    '        browser.goto(url);\n' +
    '        return;\n' +
    '      }\n' +
    '    }\n' +
    '    window.location.assign(url);\n' +
    '  }\n' +
    '  document.addEventListener("xhrsuccess", function (event) {\n' +
    '    var detail = event.detail;\n' +
    '    if (!detail || detail.status >= 400) return;\n' +
    '    var url = findUrl(detail.response);\n' +
    '    if (url) go(url);\n' +
    '  });\n' +
    '})();\n' +
    '</scr' + 'ipt>';

function injectNavScript(html) {
    if (typeof html !== 'string' || html.indexOf('</body>') === -1) {
        return html;
    }
    if (html.indexOf(NAV_MARKER) !== -1) {
        return html;
    }
    return html.replace('</body>', INLINE_SCRIPT + '</body>');
}

module.exports = {
    before(app) {
        app.use(function (req, res, next) {
            const send = res.send.bind(res);
            res.send = function (body) {
                if (typeof body === 'string') {
                    body = injectNavScript(body);
                }
                return send(body);
            };
            next();
        });
    }
};
