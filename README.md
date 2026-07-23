# Meteor — website (unlisted)

Static site for [meteor.jlundmark.org](https://meteor.jlundmark.org), deployed with **Cloudflare Pages** directly from the GitHub repository (no build).

Asteroid remains on GitHub Pages until its Play review is fully done. Meteor uses Cloudflare Pages from the start.

**Crawl status:** intentionally **not** searchable while you work on drafts. Cloudflare Pages does **not** make the site private — a public URL can still be fetched and indexed. While drafting, keep both:

- `<meta name="robots" content="noindex, nofollow">` on every page
- `robots.txt` with `User-agent: *` / `Disallow: /`

Anyone who knows the URL can still open the site (no login). That is what you want for sharing internally.

When the Privacy Policy is ready for **Google Play**, the page must stay publicly reachable without login (Cloudflare Pages already does that). Then open crawling for the pages you want indexed: remove `noindex, nofollow`, set `Allow: /` in `robots.txt`, and re-add the Sitemap line. Play needs to fetch the policy URL; it does not require the page to appear in Google Search, but you should not block Play’s fetchers — so do not put the live privacy URL behind auth, and prefer opening `robots.txt` / removing blanket `Disallow: /` before you submit the listing.

| URL | Page |
|-----|------|
| `/` | Home |
| `/getting-started/` | Add your first library |
| `/help/` | FAQ / troubleshooting |
| `/about/` | About |
| `/privacy/` | Privacy policy (**draft**) |
| `/terms/` | Terms of use (**draft**) |
| `/metadata/` | Metadata & attribution (**draft**) |
| `/contact/` | Contact placeholders |

No build step. Edit HTML/CSS and push to `main` — Cloudflare Pages redeploys automatically.

## Local development

```bash
cd meteor-website
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Deploy with Cloudflare Pages

### 1. Push the repository to GitHub

```bash
cd meteor-website
git add .
git commit -m "Add Meteor static site for Cloudflare Pages"
gh repo create JLUNDMRK/meteor-website --public --source=. --remote=origin --push
```

Use branch name **`main`** (rename from `master` if needed: `git branch -M main` before the first push).

There is **no** root `CNAME` file in this repo — that file is for GitHub Pages. Cloudflare manages the custom domain in the dashboard.

### 2. Connect the repo in Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select the `meteor-website` repository (authorize GitHub if prompted)
3. Configure the project:

| Setting | Value |
|---------|--------|
| Production branch | `main` |
| Framework preset | **None** |
| Build command | *(leave empty)* |
| Build output directory | `/` (use `.` if the UI rejects `/`) |

4. Save / Deploy. The first deploy should publish the static HTML/CSS as-is.

Every later **push to `main`** triggers an automatic production deploy.

### 3. Custom domain

1. In the Pages project → **Custom domains** → **Set up a domain**
2. Add `meteor.jlundmark.org`
3. Follow Cloudflare’s DNS prompts on `jlundmark.org` (usually a CNAME to the Pages project hostname). Keep the record **proxied** (orange cloud) when Cloudflare suggests it.

Result: `https://meteor.jlundmark.org/` serves this site from Cloudflare Pages.

### Redirects and security headers

These are repo files Cloudflare Pages picks up automatically (no dashboard rules required):

| File | Purpose |
|------|---------|
| [`_redirects`](_redirects) | `/privacy.html` → `/privacy/`, `/index.html` → `/`, etc. |
| [`_headers`](_headers) | `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` |

You can still add extra Redirect Rules in the Cloudflare dashboard later if you want; the repo files cover the common tidy-URL cases.

### 4. Play Console (when ready)

- **Privacy policy URL:** `https://meteor.jlundmark.org/privacy/`
- Optional terms: `https://meteor.jlundmark.org/terms/`
- Optional store listing website: `https://meteor.jlundmark.org/`

**Do not** point Play at Privacy/Terms until:

1. Draft banners are removed and the documents match the shipped app
2. The privacy URL loads without login (already true on Pages)
3. You have opened crawl controls appropriately (see crawl status above) so nothing unexpectedly blocks reviewers or automated checks

## Configuration

Central reference: [`assets/site.config.js`](assets/site.config.js).  
Values are **mirrored in HTML** (no build). Update both when going live.

Site version shown in every footer (`Website v0.1 · Updated July 2026`) comes from `websiteVersion` / `websiteUpdated` in that config — bump the config **and** the footer strings together when you ship a site change.

### Placeholder values to change before launch

| Key | Current placeholder | Notes |
|-----|---------------------|--------|
| `siteUrl` | `https://meteor.jlundmark.org` | Confirm DNS / Pages custom domain |
| `packageId` / Play URL | `com.asteroid.mediaplayer` | Confirm final applicationId |
| `appStoreUrl` | Play details URL with that id | Replace “Coming soon” badge on home when live |
| `supportEmail` | `meteor@jlundmark.org` | Confirm mailbox exists |
| `privacyEmail` | `meteor@jlundmark.org` | Confirm mailbox exists |
| `githubUrl` / issues | `JLUNDMRK/AsteroidMediaplayerKMP` | Confirm public repo |
| `appStatus` | `coming_soon` | Flip to `live` when listed |
| `websiteVersion` / `websiteUpdated` | `0.1` / `July 2026` | Footer + config must stay in sync |
| `crawlable` | `false` | Set `true` when opening search indexing |
| `policyEffectiveDate` | `2026-07-23` | Set real effective date after legal review |
| `metadataProviders[].enabled` | OMDb `true`, TMDB `false` | Must match shipped flavor |
| Social share image | `assets/og-share.png` | Currently a copy of the logo — replace with 1200×630 art |
| App screenshots | dashed placeholders on Home / Getting Started | Add real captures |
| Google Play badge | “Coming soon” pill | Official badge when listing is live |
| Provider logos | placeholders on Metadata page | Optional |

## TODO checklist (publication)

- [ ] Confirm emails and GitHub URLs
- [ ] Confirm Play package id and store URL
- [ ] Connect GitHub → Cloudflare Pages (`main`, no build, output `/` or `.`)
- [ ] Attach custom domain `meteor.jlundmark.org`
- [ ] Review Privacy against the Android app; remove draft banner
- [ ] Review Terms; remove draft banner
- [ ] Align Metadata provider cards with the shipped build
- [ ] Add real screenshots
- [ ] Replace `og-share.png`
- [ ] Swap “Coming soon” for Play badge / working store link
- [ ] Before Play / public launch: set `Allow: /` in `robots.txt`, add Sitemap line, remove `noindex, nofollow` from pages that should be indexed, set `crawlable: true` in `site.config.js`

## Statements that still depend on app confirmation

See the Privacy, Terms, and Metadata pages (`.todo` callouts). In short:

**Privacy**

- Exact local storage contents (index, artwork cache, progress, settings)
- Exact Android permissions
- Exact metadata providers and query fields
- Whether any device/install identifiers are sent with metadata requests
- Analytics / Crashlytics / diagnostics (present or not — do not claim “no collection” until verified)
- Support-email retention

**Terms**

- Scope of DLNA-only first release vs any other sources that might ship
- Any billing / subscription wording when introduced

**Metadata**

- Which providers are actually enabled per flavor (OMDb vs TMDB)
- Required attribution text and logos per provider terms
- Offline / online behaviour for identification

## Design notes

- Dark cinematic layout aligned with the Meteor app palette (`MeteorColors`) and the Asteroid site structure
- System fonts only (no external webfonts)
- FAQ uses native `<details>` (works without JavaScript)
- Logo from the app: `assets/logo.png`

## CI checks (GitHub Actions)

Cloudflare already deploys on push to `main`. Separately, [`.github/workflows/site-checks.yml`](.github/workflows/site-checks.yml) runs on pull requests and pushes to `main`:

- HTML validate (`html-validate`)
- CSS lint (`stylelint` + `.stylelintrc.json`)
- Offline broken-link check (`lychee`)

This catches a broken PR before it reaches production.

## Files

```
_redirects
_headers
404.html
robots.txt
sitemap.xml
favicon.ico
favicon.svg
apple-touch-icon.png
index.html
about/index.html
contact/index.html
getting-started/index.html
help/index.html
metadata/index.html
privacy/index.html
terms/index.html
assets/site.css
assets/site.config.js
assets/logo.png
assets/icon.png
assets/og-share.png
.github/workflows/site-checks.yml
.stylelintrc.json
```
