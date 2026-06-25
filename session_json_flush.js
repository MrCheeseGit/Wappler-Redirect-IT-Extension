/**
 * Optional routes hook — persist session before redirect JSON is sent.
 * Install to extensions/server_connect/routes/session_json_flush.js
 *
 * Use when login or similar actions set req.session and redirect in the same API call
 * (avoids navigating before the session store finishes writing).
 */

module.exports = {
    before(app) {
        app.use(function (req, res, next) {
            const path = String(req.path || req.originalUrl || '');
            if (!path.includes('/api/')) {
                return next();
            }

            const json = res.json.bind(res);
            res.json = function (body) {
                const send = () => json(body);
                const needsFlush = body
                    && typeof body === 'object'
                    && (body.redirectUrl || body.$redirect);

                if (needsFlush && req.session && typeof req.session.save === 'function') {
                    return req.session.save(function (err) {
                        if (err) {
                            console.error('session_json_flush: save failed', err);
                        }
                        send();
                    });
                }

                return send();
            };

            next();
        });
    }
};
