# Redirect-IT Extension

**Redirect to a project page from your Server Action** — pick a route from `routes.json`, drop the step in a condition or anywhere in the flow, done.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Wappler](https://img.shields.io/badge/Wappler-Server%20Connect-teal)
![Version](https://img.shields.io/badge/version-1.0.1-green)

Built by **[Mr Cheese](https://www.mrcheese.co.uk)** · Wappler extensions & custom modules

---

## What it does

1. **Redirect To Page** — Server Connect step with a **Page** picker (`routes.json`).
2. Resolves page names and view paths at runtime.
3. Works in **conditions**, branches, and any Server Action — not just forms.
4. Actually navigates the browser (unlike Wappler’s core Redirect on API calls).

---

## Requirements

### `dmx-browser` in your layout (required)

Redirect-IT navigates via Wappler’s **Browser** component. Your main layout **must** include:

```html
<div is="dmx-browser" id="browser"></div>
```

- **`id="browser"`** is required — the auto-injected listener calls `dmx.app.find('browser').goto(url)`.
- Add this once in your layout; you do **not** add Redirect-IT scripts to individual pages.

If `dmx-browser` is missing, redirects from API calls will not navigate the user.

---

## Why Wappler’s core Redirect fails (and this fixes it)

Wappler’s **Core Actions → Redirect** calls `res.redirect()`. That works when the **browser** loads the URL directly. It does **not** work when the action runs inside an **API** called by Server Connect (forms, `dmx-serverconnect`, conditions that POST to `/api/...`) — the XHR follows the redirect in the background and the user stays put.

Redirect-IT fixes that without you wiring **Success → browser.goto** on every form:

| Piece | Role |
|-------|------|
| **redirectit.js** | Server step: resolve page → set `$redirect` on API JSON (or HTTP redirect for full-page requests) |
| **redirectit_nav.js** | Routes hook: auto-injects a tiny listener into every HTML page — navigates when `$redirect` is present |
| **`dmx-browser`** | Layout component the listener uses to navigate (`browser.goto`) |

You install the extension files once. No layout scripts. No per-form events.

---

## Installation

```bash
cp redirectit.hjson     [PROJECT]/extensions/server_connect/modules/
cp redirectit.js        [PROJECT]/lib/modules/
cp redirectit.js        [PROJECT]/extensions/server_connect/modules/redirectit.js
cp redirectit_nav.js    [PROJECT]/extensions/server_connect/routes/redirectit_nav.js
```

1. Ensure your layout has **`dmx-browser`** with **`id="browser"`** (see [Requirements](#requirements)).
2. **Quit Wappler completely and restart.**

The action appears under **Mr Cheese → Redirect To Page**.

---

## Usage

Add **Redirect To Page** anywhere in a Server Action:

```
Condition  →  if admin  →  Redirect To Page  →  /admin
           →  else     →  Redirect To Page  →  /portal
```

Pick the page from the route picker. That’s it.

**Custom URL** mode binds a dynamic path (`{{'/user/' + id}}`). **Query string** appends `?lang=en` if needed.

---

## vs Core Redirect

| | Core Redirect | Redirect-IT |
|---|---------------|-------------|
| **Page picker** | “Url” | **Page** from `routes.json` |
| **Resolves page / view paths** | No | Yes |
| **Works in API / conditions** | No (browser stays) | **Yes** (via `$redirect` + nav hook) |
| **Per-form Success wiring** | Manual `browser.goto` | **Not required** |
| **`dmx-browser` in layout** | Recommended for SPA nav | **Required** |
| **HTTP status picker** | 301 / 302 / 303 | No (302) |

---

## Page resolution

| Input | Resolves to |
|-------|-------------|
| `/dashboard` | `/dashboard` |
| `dashboard` | route path from `routes.json` |
| `/views/dashboard.ejs` | route path |

---

## License

MIT — see [LICENSE](LICENSE).
