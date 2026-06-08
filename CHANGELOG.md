# Changelog

## 1.0.1 — 2026-06-04

- **Fix:** Page field no longer auto-fills with the currently open route when cleared and saved — removed Wappler `required` on the `routePicker` field (runtime validation unchanged)

## 1.0.0 — 2026-06-04

- **Redirect To Page** — Server Connect step under Mr Cheese with a **Page** picker from `routes.json`
- Resolves page names and view paths at runtime; **Custom URL** mode and optional query string
- Works in **conditions**, branches, and any Server Action — not just forms
- API / Server Connect calls set `$redirect` on the JSON response; **`redirectit_nav.js`** routes hook auto-injects navigation (no layout scripts, no per-form Success handlers)
- Full-page requests use HTTP `res.redirect()` (302)
- **Requires** a **`dmx-browser`** component in your layout (`id="browser"`) for client-side navigation
