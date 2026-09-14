# web_for_mimi

## Site https://miminavi.tech

Angular 21 presentation site for MiMiNavigator and MiMiTrends.

## What is inside

- Angular standalone application structure
- Dedicated `/trends` product page with release downloads, current screenshots, feature details, and FAQ
- Clean landing page inspired by the product-first layout rhythm of Fork
- Git-ready folder with `.gitignore`
- IntelliJ IDEA friendly project folder with minimal `.idea` metadata

## Run locally

```bash
npm install
npm start
```

## Build

```bash
npm run build
```

## Product content and screenshots

- Visible release, DMG, and commit timestamps use compact `DD.MM.YYYY HH:mm` formatting in the visitor’s browser time zone. The DMG release annotation uses smaller text; operation-feedback tags share equal dimensions.
- Release metadata comes from GitHub. Development commits are labelled separately because they may not be part of the downloadable release.
- Production builds fetch the latest MiMiNavigator and MiMiTrends releases and write their versions, publication dates, and release URLs into the rendered JSON-LD. The same release dates are written to `sitemap.xml`, so these values must not be maintained by hand.
- Successful Vercel production deployments trigger `.github/workflows/notify-indexnow.yml`, which submits `/` and `/trends` to IndexNow once per deployment. The verification key is served from the site root. Google discovery continues through the sitemap declared in `robots.txt`; do not notify search engines from visitor page loads.

### Register release-triggered metadata refreshes

The public page loads release details dynamically, but search crawlers also need a newly rendered HTML document after a release. Connect GitHub Releases to the production deployment once:

1. In the Vercel project, open **Settings → Git → Deploy Hooks**.
2. Create a hook named `MiMi release metadata`, targeting the `master` branch, and copy its URL.
3. In each product repository (`senatov/MiMiNavigator` and `senatov/mimiTrends`), open **Settings → Webhooks → Add webhook**.
4. Paste the Vercel Deploy Hook URL as the payload URL, select `application/json`, choose **Let me select individual events**, enable **Releases**, and save the active webhook.

GitHub will then call the private Deploy Hook URL when release state changes. Vercel rebuilds the site, the build reads the current release metadata, and the successful production deployment triggers a single IndexNow notification. Treat the Deploy Hook URL as a secret and do not commit it to either repository.
- PrimeNG Galleria provides fullscreen browsing and responsive thumbnail navigation. The shared Angular Material dialog adds fit-to-window, 1:1 viewing, zoom controls, keyboard dismissal, and scrollable detail inspection for both products.
- Both product pages subtly highlight product names, technical keywords, and versions in blue with a medium-bold weight, including dynamically loaded content. Links, buttons, icon glyphs, hero badges, and the commit feed retain their own styling.
- Both product pages share subtly rounded, raised content cards with a soft gradient, inset highlight, and restrained shadow. Improvement icons use centered flex containers and Material Icons Outlined glyph names.
- Screenshots retain their original proportions and colors. Preview cards use a consistent media area without cropping the image.
- Local and supported cloud-provider recycling is distinguished from potentially permanent protocol-based remote deletion.

## Deployment checks

Run `npm run build` followed by `node scripts/render-static-routes.mjs` to validate the production bundle and route-specific static metadata. Before publishing, inspect `/` and `/trends` at desktop and mobile widths, test fullscreen navigation and zoom, and confirm the download link against the GitHub release.
