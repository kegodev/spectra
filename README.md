# SpectraLab

SpectraLab is a browser-based **UV–Vis calibration and Beer–Lambert law simulator** built with vanilla HTML, CSS, and JavaScript. It is designed as a practical educational tool for analytical chemistry students and as a clean portfolio project demonstrating UI engineering, data handling, numerical methods, and responsive visualisation.

## Features

- Editable calibration standards
- Ordinary least-squares linear regression
- Live slope, intercept, and R² calculation
- Responsive calibration-curve rendering using the Canvas API
- Unknown concentration calculation by interpolation/extrapolation
- Basic calibration-quality diagnostics
- Experiment metadata: analyte, wavelength, path length, and units
- CSV export for standards and calculated results
- Responsive layout with no framework or build step
- Accessible labels and keyboard-friendly controls

## Mathematical model

The calibration is represented as:

```text
A = mc + b
```

where:

- `A` = absorbance
- `c` = concentration
- `m` = fitted slope
- `b` = fitted intercept

The unknown concentration is calculated as:

```text
c = (A - b) / m
```

The app also calculates the coefficient of determination, `R²`, from the residual and total sums of squares.

## Run locally

No installation is required.

1. Clone or download the repository.
2. Open `index.html` in a browser.

For a local development server, you can use any static server, for example:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Project structure

```text
spectralab/
├── assets/
│   └── logo.svg
├── index.html
├── styles.css
├── app.js
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

## Suggested GitHub topics

`chemistry` `uv-vis` `beer-lambert-law` `analytical-chemistry` `javascript` `html` `css` `education` `data-visualization` `stem`

## Roadmap

- Replicate measurements and error bars
- Weighted linear regression
- Blank subtraction workflow
- Confidence intervals for the unknown
- Multiple saved calibration sets
- Import calibration standards from CSV

## Disclaimer

SpectraLab is an educational simulator. It is not validated software for regulated laboratory, clinical, environmental, or quality-control reporting.
