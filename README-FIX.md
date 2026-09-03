# Spectra CI Fix

## Upload / replace

Replace this existing file in your repository:

`.github/workflows/webpack.yml`

with the `webpack.yml` included in this package.

## Delete

Delete this workflow from GitHub:

`.github/workflows/npm-publish-github-packages.yml`

Spectra is currently a static HTML/CSS/JavaScript web application, not an npm package, so the release workflow should not run `npm ci`, `npm test`, or `npm publish`.

## What the new workflow checks

- `index.html` exists
- `app.js` exists
- `styles.css` exists
- `app.js` has valid JavaScript syntax
- `index.html` references `styles.css` and `app.js`
- local files referenced from `index.html` actually exist
- runs automatically on pushes and pull requests to `main`

## Suggested commit message

`fix: replace invalid webpack CI with static app checks`

## Suggested PR title

`Fix CI workflow for Spectra static web app`
