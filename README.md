# Redirect-IT Extension


**Redirect to a project page from your Server Action** — pick a route from `routes.json`, drop the step in a condition or anywhere in the flow, done.

[![License: Mr Cheese Extension v1.0](https://img.shields.io/badge/License-Mr%20Cheese%20Extension%20v1.0-blue.svg)](https://www.mrcheese.co.uk/extension-license)
![Wappler](https://img.shields.io/badge/Wappler-Server%20Connect-teal)
![Version](https://img.shields.io/badge/version-1%2E0%2E10-green)

Built by **[Mr Cheese](https://www.mrcheese.co.uk)** · Wappler extensions & custom modules

---

## What it does

1. **Redirect To Page** — Server Connect step with a **Page** picker (`routes.json`).
2. Resolves page names and view paths at runtime.
3. Works in **conditions**, branches, and any Server Action — not just forms.
4. Actually navigates the browser (unlike Wappler’s core Redirect on API calls).

---

## Requirements

### Wappler Browser component in your layout (optional)

The auto-injected nav hook navigates with `window.location.assign` after API success. You do **not** need a Browser component for that path.

Add Wappler’s **Browser** App Connect component if you also use **`dmx-on:success`** handlers that call `browser.goto`, or other App Connect navigation:

**In Wappler:**

1. Open your main **layout** (or the content page that wraps your app).
2. From **App Connect**, add the **Browser** component.
3. In Properties, set **ID** to `browser`.

Do **not** paste `<div is="dmx-browser">` into the HTML by hand — that omits the scripts and includes Wappler adds when you drop the component from the panel. The designer output will include something like:

```html
<div is="dmx-browser" id="browser"></div>
```

plus the App Connect script tags it needs.

- Add the Browser component once in your layout if you rely on `browser.goto` in custom Success handlers.
- You do **not** add Redirect-IT scripts to individual pages — `redirectit_nav.js` injects the listener automatically.

---

## Why Wappler’s core Redirect fails (and this fixes it)

Wappler’s **Core Actions → Redirect** calls `res.redirect()`. That works when the **browser** loads the URL directly. It does **not** work when the action runs inside an **API** called by Server Connect (forms, `dmx-serverconnect`, conditions that POST to `/api/...`) — the XHR follows the redirect in the background and the user stays put.

Redirect-IT fixes that without you wiring **Success → browser.goto** on every form:

| Piece | Role |
|-------|------|
| **redirectit.js** | Server step: resolve page → set `$redirect` / `redirectUrl` on API JSON, then stop the action (or HTTP redirect for full-page requests) |
| **redirectit_nav.js** | Routes hook: auto-injects a tiny listener into every HTML page — navigates when `$redirect` or `redirectUrl` is present |
| **session_json_flush.js** *(optional)* | Routes hook: `req.session.save()` before JSON when a redirect field is present — avoids session store races on login |
| **`dmx-browser`** | Optional — only needed if you use custom Success handlers with `browser.goto` |

You install the extension files once. No layout scripts. No per-form events.

---

## Installation

Official Wappler guide: [How To Install Custom Wappler Extensions](https://docs.wappler.io/t/how-to-install-custom-wappler-extensions/49982/).

| Path | |
|------|--|
| **npm** | Wappler Project Settings → Extensions (`wappler-redirect-it`) |
| **Git** | [Extension Installer](https://www.mrcheese.co.uk/extensions/install) or manual copy below |

Git manual copy installs into `extensions/`, `lib/modules/`, and `extensions/server_connect/routes/`.

### Git install — Extension Installer (recommended)

This repo ships **`wappler-install.json`** at the root — copy paths, folders, and post-install notes for the [Mr Cheese Extension Installer](https://www.mrcheese.co.uk/extensions/install). Select **Redirect-IT**, keep **Use wappler-install.json from the repository** enabled, enter your project path, and run the generated script locally.

### Manual install (Git)

Run from your **Wappler project root**; skip `git clone` if you already cloned this repo alongside your project:

```bash
git clone https://github.com/MrCheeseGit/Wappler-Redirect-IT-Extension.git ../Wappler-Redirect-IT-Extension

cp ../Wappler-Redirect-IT-Extension/server_connect/modules/redirectit.hjson extensions/server_connect/modules/
cp ../Wappler-Redirect-IT-Extension/server_connect/modules/redirectit.js lib/modules/
cp ../Wappler-Redirect-IT-Extension/server_connect/modules/redirectit.js extensions/server_connect/modules/redirectit.js
cp ../Wappler-Redirect-IT-Extension/server_connect/modules/redirectit_nav.js extensions/server_connect/routes/redirectit_nav.js
cp ../Wappler-Redirect-IT-Extension/server_connect/modules/session_json_flush.js extensions/server_connect/routes/session_json_flush.js   # optional, recommended for login redirects
```

1. Add the **Browser** component to your layout only if you use custom `browser.goto` Success handlers (see [Requirements](#requirements)).
2. **Quit Wappler completely and restart.**

The action appears under **Mr Cheese → Redirect To Page**.

### npm install (Wappler Project Settings)

1. **Wappler** → Project Settings → Extensions → Add → `wappler-redirect-it`
2. From your project root: `npm install`
3. **Quit Wappler completely** and reopen your project.

#### Local `file:` development (optional)

```json
"devDependencies": {
  "wappler-redirect-it": "file:../path/to/this-extension"
}
```

After you change extension source, run `npm install` again, then Project Updater if needed, and restart Wappler.

## Usage

Add **Redirect To Page** anywhere in a Server Action:

```
Condition  →  if admin  →  Redirect To Page  →  /admin
           →  else     →  Redirect To Page  →  /portal
```

Pick the page from the route picker. That’s it.

**Custom URL** mode binds a dynamic path (`{{'/user/' + id}}`). **Query string** appends `?lang=en` if needed.

### Tips for reliable redirects

- Place **Redirect To Page** **before** slow steps (push notifications, email, webhooks). On API calls the step stops the action immediately after setting `$redirect` / `redirectUrl`.
- For login flows that write `req.session`, install **`session_json_flush.js`** so the session is persisted before the browser navigates.
- Custom **`dmx-on:success`** handlers can read `redirectUrl` from the response. Avoid wiring both the nav hook and a Success handler to navigate — use one or the other.
- If you use a honeypot / bot guard with a minimum submit delay, wait for that window before the user can submit; fast double-clicks can fail validation unrelated to Redirect-IT.

---

## vs Core Redirect

| | Core Redirect | Redirect-IT |
|---|---------------|-------------|
| **Page picker** | “Url” | **Page** from `routes.json` |
| **Resolves page / view paths** | No | Yes |
| **Works in API / conditions** | No (browser stays) | **Yes** (via `$redirect` + nav hook) |
| **Per-form Success wiring** | Manual `browser.goto` | **Not required** (nav hook) |
| **`dmx-browser` in layout** | Recommended for SPA nav | **Optional** (nav hook uses `location.assign`) |
| **HTTP status picker** | 301 / 302 / 303 | No (302) |

---

## Page resolution

| Input | Resolves to |
|-------|-------------|
| `/dashboard` | `/dashboard` |
| `dashboard` | route path from `routes.json` |
| `/views/dashboard.ejs` | route path |

---

## Compatibility

See [Mr Cheese extension docs](https://github.com/MrCheeseGit/Wappler-Extension-Docs/blob/main/extension-compatibility.md) for **step order** on API login: Redirect To Page stops the rest of the action; run push, email, and logging **before** redirect.

## License

[Mr Cheese Extension License v1.0](https://www.mrcheese.co.uk/extension-license) — see [LICENSE](LICENSE). © [Mr Cheese](https://www.mrcheese.co.uk)
