# Contriverite

A responsive, single-page website for website remodeling, custom software, software security, and AI development and business integration.

## Run locally

With Node.js 24 LTS:

```sh
npm run dev
```

Open http://127.0.0.1:5173. No dependency installation or compilation is required. Set `PORT` to use a different port or `HOST` to override the listening interface. Local development defaults to `127.0.0.1`; production defaults to `0.0.0.0`.

```sh
npm test
```

## Publishing

### Railway

Live environments:

- Production: https://web-production-53bb3fa3.up.railway.app/
- Staging: https://web-staging-04389413.up.railway.app/
- Project dashboard: https://railway.com/project/c2084578-b80e-4356-a833-895088f1a358
- Production source: `DHomesy/Contriverite`, branch `master`.

- Runtime: Node.js 24, selected by `package.json`.
- Builder: Railpack.
- Build command: `npm run build`. This checks JavaScript syntax and runs the tests; it does not generate a bundle.
- Start command: `npm start`.
- Variables: `NODE_ENV=production`. Railway supplies `PORT`; do not hardcode a target port.
- Deployment health check: `/`, with a 60-second timeout.
- Restart policy: on failure, up to 5 retries.
- No database, persistent volume, or email credentials are required for launch.

The server serves only the public page and assets, not repository files. It handles `SIGTERM` for graceful deployment shutdowns. Use a Railway-generated HTTPS domain first; connect the custom domain only after verifying the live site.

The GitHub workflow validates pushes to `master` and pull requests. When the Railway service is connected to GitHub, enable **Wait for CI**. CLI uploads also run validation through the configured build command. Railway deployment health checks are not continuous monitoring; configure an external uptime monitor separately.

Set service options through Railway's dashboard or CLI. Do not introduce `railway.json` or `railway.toml`: Railway's current documentation no longer permits new services to opt into that deprecated configuration format.

For a manual release, run validation, deploy staging, verify its public URL, then deploy production:

```sh
npm run build
railway up --project c2084578-b80e-4356-a833-895088f1a358 --service web --environment staging --ci
railway up --project c2084578-b80e-4356-a833-895088f1a358 --service web --environment production --ci
```

Confirm each deployment has `SUCCESS` status and check the HTTPS site before considering a release complete. The initial production release was uploaded through the CLI; verify a successful GitHub-triggered deployment before relying on automatic releases.

Both environments are running Railway services and can incur usage charges. Custom-domain DNS, external uptime monitoring, and automatic email delivery are not configured yet.

### Other static hosts

Alternatively, deploy `index.html`, `styles.css`, `script.js`, and `favicon.svg` at the site root on a static host. The Node server is not required for that approach. Serve over HTTPS for clipboard support.

## Contact flow

Calls to action scroll to the inquiry form. Service-specific links preselect the relevant service. The form validates the details and opens a `mailto:` draft addressed to **support@contriverite.com**; the visitor must review and send it in their email app. It does **not** send, store, or submit inquiries to a backend. The copy-brief fallback and direct email links are provided for visitors without a configured email app. Without JavaScript, the draft builder is replaced with direct-email instructions.

For automatic submissions, replace this email-draft flow with an actual server endpoint or a configured form provider, and add appropriate privacy and submission feedback.

## Design and accessibility

The hero pairs concise copy with an animated website and software concept, not a claimed client project or a working application. The entrance, workflow checks, and progress animation finish within 2.4 seconds; visitors can replay them. Reduced-motion preferences disable animations and hide the replay control. Without JavaScript, the concept still renders, but the replay button stays hidden.

The site uses system fonts, with no external assets, tracking, cookies, or runtime dependencies. It includes keyboard focus indicators, a skip link, native FAQ disclosures, mobile navigation, and labeled fields. Colors and layout tokens are in `styles.css`; page copy is in `index.html`.
