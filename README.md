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

- Release metadata comes from GitHub. Development commits are labelled separately because they may not be part of the downloadable release.
- PrimeNG Galleria provides fullscreen browsing and responsive thumbnail navigation. The shared Angular Material dialog adds fit-to-window, 1:1 viewing, zoom controls, keyboard dismissal, and scrollable detail inspection for both products.
- Screenshots retain their original proportions and colors. Preview cards use a consistent media area without cropping the image.
- Local and supported cloud-provider recycling is distinguished from potentially permanent protocol-based remote deletion.

## Deployment checks

Run `npm run build` followed by `node scripts/render-static-routes.mjs` to validate the production bundle and route-specific static metadata. Before publishing, inspect `/` and `/trends` at desktop and mobile widths, test fullscreen navigation and zoom, and confirm the download link against the GitHub release.
