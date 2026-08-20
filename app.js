const state = {
  standards: [
    { concentration: 0, absorbance: 0.012 },
    { concentration: 2, absorbance: 0.188 },
    { concentration: 4, absorbance: 0.366 },
    { concentration: 6, absorbance: 0.541 },
    { concentration: 8, absorbance: 0.719 },
    { concentration: 10, absorbance: 0.895 },
  ],
  regression: null,
};

const el = {
  analyte: document.querySelector('#analyte'),
  wavelength: document.querySelector('#wavelength'),
  pathLength: document.querySelector('#pathLength'),
  unit: document.querySelector('#unit'),
  standardsBody: document.querySelector('#standardsBody'),
  slopeMetric: document.querySelector('#slopeMetric'),
  interceptMetric: document.querySelector('#interceptMetric'),
  r2Metric: document.querySelector('#r2Metric'),
  equationText: document.querySelector('#equationText'),
  chart: document.querySelector('#chart'),
  qualityPill: document.querySelector('#qualityPill'),
  unknownAbsorbance: document.querySelector('#unknownAbsorbance'),
  unknownResult: document.querySelector('#unknownResult'),
  unknownUnit: document.querySelector('#unknownUnit'),
  resultNote: document.querySelector('#resultNote'),
  diagnosticsList: document.querySelector('#diagnosticsList'),
  addRowBtn: document.querySelector('#addRowBtn'),
  solveBtn: document.querySelector('#solveBtn'),
  exportBtn: document.querySelector('#exportBtn'),
  resetBtn: document.querySelector('#resetBtn'),
};

function finiteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function calculateRegression(points) {
  const valid = points.filter(p => Number.isFinite(p.concentration) && Number.isFinite(p.absorbance));
  if (valid.length < 2) return null;

  const n = valid.length;
  const sumX = valid.reduce((s, p) => s + p.concentration, 0);
  const sumY = valid.reduce((s, p) => s + p.absorbance, 0);
  const sumXY = valid.reduce((s, p) => s + p.concentration * p.absorbance, 0);
  const sumXX = valid.reduce((s, p) => s + p.concentration ** 2, 0);
  const denominator = n * sumXX - sumX ** 2;
  if (Math.abs(denominator) < Number.EPSILON) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  const meanY = sumY / n;
  const ssTot = valid.reduce((s, p) => s + (p.absorbance - meanY) ** 2, 0);
  const ssRes = valid.reduce((s, p) => s + (p.absorbance - (slope * p.concentration + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { slope, intercept, r2, points: valid };
}

function format(value, digits = 4) {
  return Number.isFinite(value) ? value.toFixed(digits) : '—';
}

function renderStandards() {
  el.standardsBody.innerHTML = '';
  state.standards.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td><input aria-label="Standard ${index + 1} concentration" type="number" min="0" step="0.01" data-index="${index}" data-field="concentration" value="${row.concentration}"></td>
      <td><input aria-label="Standard ${index + 1} absorbance" type="number" min="0" step="0.001" data-index="${index}" data-field="absorbance" value="${row.absorbance}"></td>
      <td><button class="remove-row" type="button" data-remove="${index}" aria-label="Remove standard ${index + 1}">×</button></td>
    `;
    el.standardsBody.appendChild(tr);
  });
}

function updateRegression() {
  state.regression = calculateRegression(state.standards);
  const r = state.regression;

  if (!r) {
    el.slopeMetric.textContent = '—';
    el.interceptMetric.textContent = '—';
    el.r2Metric.textContent = '—';
    el.equationText.textContent = 'Add at least two valid standards with different concentrations.';
    setQuality(null);
  } else {
    el.slopeMetric.textContent = format(r.slope, 5);
    el.interceptMetric.textContent = format(r.intercept, 5);
    el.r2Metric.textContent = format(r.r2, 5);
    const sign = r.intercept >= 0 ? '+' : '−';
    el.equationText.textContent = `A = ${format(r.slope, 5)}c ${sign} ${format(Math.abs(r.intercept), 5)}`;
    setQuality(r.r2);
  }

  renderDiagnostics();
  drawChart();
  solveUnknown(false);
}

function setQuality(r2) {
  el.qualityPill.className = 'status-pill';
  if (r2 === null) {
    el.qualityPill.textContent = 'Waiting for data';
    return;
  }
  if (r2 >= 0.995) {
    el.qualityPill.textContent = 'Excellent linearity';
    el.qualityPill.classList.add('good');
  } else if (r2 >= 0.98) {
    el.qualityPill.textContent = 'Review linearity';
    el.qualityPill.classList.add('warn');
  } else {
    el.qualityPill.textContent = 'Poor linearity';
    el.qualityPill.classList.add('bad');
  }
}

function renderDiagnostics() {
  const items = [];
  const r = state.regression;

  if (!r) {
    items.push('At least two standards with different concentrations are required.');
  } else {
    if (r.r2 >= 0.995) items.push(`R² = ${format(r.r2, 5)} indicates strong linear agreement for this simulated dataset.`);
    else items.push(`R² = ${format(r.r2, 5)} suggests the standards should be checked for curvature, outliers, or preparation error.`);

    const maxAbs = Math.max(...r.points.map(p => p.absorbance));
    if (maxAbs > 1.2) items.push('One or more absorbances exceed 1.2; dilution may improve practical UV–Vis measurement quality.');
    else items.push('All entered absorbances are within a typical teaching-lab working range below 1.2.');

    if (Math.abs(r.intercept) > 0.05) items.push('The intercept is noticeably displaced from zero; consider blank correction or baseline effects.');
    else items.push('The fitted intercept is close to zero, consistent with a well-blanked linear calibration.');
  }

  el.diagnosticsList.innerHTML = items.map(item => `<li>${item}</li>`).join('');
}

function solveUnknown(showMessage = true) {
  const r = state.regression;
  const absorbance = finiteNumber(el.unknownAbsorbance.value);
  el.unknownUnit.textContent = el.unit.value;

  if (!r || absorbance === null || Math.abs(r.slope) < Number.EPSILON) {
    el.unknownResult.textContent = '—';
    el.resultNote.textContent = 'A valid calibration and unknown absorbance are required.';
    return;
  }

  const concentration = (absorbance - r.intercept) / r.slope;
  el.unknownResult.textContent = concentration >= 0 ? format(concentration, 3) : 'Below zero';

  const xs = r.points.map(p => p.concentration);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const inRange = concentration >= minX && concentration <= maxX;
  el.resultNote.textContent = inRange
    ? `Interpolated within the ${format(minX, 2)}–${format(maxX, 2)} ${el.unit.value} calibration range.`
    : `Extrapolated outside the ${format(minX, 2)}–${format(maxX, 2)} ${el.unit.value} calibration range; treat with caution.`;

  if (showMessage) el.unknownResult.focus?.();
}

function drawChart() {
  const canvas = el.chart;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(600, Math.round(rect.width * dpr));
  canvas.height = Math.max(360, Math.round(rect.height * dpr));
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const pad = { left: 64, right: 26, top: 26, bottom: 56 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const points = state.regression?.points ?? state.standards.filter(p => Number.isFinite(p.concentration) && Number.isFinite(p.absorbance));

  let maxX = Math.max(10, ...points.map(p => p.concentration)) * 1.08;
  let maxY = Math.max(1, ...points.map(p => p.absorbance)) * 1.08;
  if (!Number.isFinite(maxX) || maxX <= 0) maxX = 10;
  if (!Number.isFinite(maxY) || maxY <= 0) maxY = 1;

  const x = value => pad.left + (value / maxX) * plotW;
  const y = value => pad.top + plotH - (value / maxY) * plotH;

  ctx.strokeStyle = '#e7e2d9';
  ctx.fillStyle = '#77736c';
  ctx.lineWidth = 1;
  ctx.font = '12px system-ui, sans-serif';

  for (let i = 0; i <= 5; i++) {
    const gx = pad.left + (plotW * i) / 5;
    const gy = pad.top + (plotH * i) / 5;

    ctx.beginPath(); ctx.moveTo(gx, pad.top); ctx.lineTo(gx, pad.top + plotH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(pad.left + plotW, gy); ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillText((maxX * i / 5).toFixed(1), gx, height - 25);
    ctx.textAlign = 'right';
    ctx.fillText((maxY * (5 - i) / 5).toFixed(2), pad.left - 10, gy + 4);
  }

  ctx.strokeStyle = '#1d1d1b';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH); ctx.lineTo(pad.left + plotW, pad.top + plotH); ctx.stroke();

  ctx.fillStyle = '#4f4d48';
  ctx.textAlign = 'center';
  ctx.fillText(`Concentration (${el.unit.value})`, pad.left + plotW / 2, height - 5);
  ctx.save();
  ctx.translate(17, pad.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Absorbance', 0, 0);
  ctx.restore();

  if (state.regression) {
    const r = state.regression;
    ctx.strokeStyle = '#1d1d1b';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x(0), y(r.intercept));
    ctx.lineTo(x(maxX), y(r.slope * maxX + r.intercept));
    ctx.stroke();
  }

  ctx.fillStyle = '#f06b21';
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(x(p.concentration), y(p.absorbance), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function addStandard() {
  const last = state.standards.at(-1) ?? { concentration: 0, absorbance: 0 };
  const previous = state.standards.at(-2) ?? { concentration: last.concentration - 2, absorbance: last.absorbance - 0.18 };
  const xStep = Math.max(1, last.concentration - previous.concentration);
  const yStep = Math.max(0.05, last.absorbance - previous.absorbance);
  state.standards.push({
    concentration: Number((last.concentration + xStep).toFixed(2)),
    absorbance: Number((last.absorbance + yStep).toFixed(3)),
  });
  renderStandards();
  updateRegression();
}

function exportCSV() {
  const r = state.regression;
  const lines = [
    ['SpectraLab UV-Vis Calibration Export'],
    ['Analyte', el.analyte.value],
    ['Wavelength (nm)', el.wavelength.value],
    ['Path length (cm)', el.pathLength.value],
    ['Concentration unit', el.unit.value],
    [],
    ['Standard', `Concentration (${el.unit.value})`, 'Absorbance'],
    ...state.standards.map((p, i) => [i + 1, p.concentration, p.absorbance]),
    [],
    ['Slope', r ? r.slope : ''],
    ['Intercept', r ? r.intercept : ''],
    ['R^2', r ? r.r2 : ''],
    ['Unknown absorbance', el.unknownAbsorbance.value],
    ['Calculated unknown', r ? (Number(el.unknownAbsorbance.value) - r.intercept) / r.slope : ''],
  ];

  const csv = lines.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spectralab-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function reset() {
  state.standards = [
    { concentration: 0, absorbance: 0.012 },
    { concentration: 2, absorbance: 0.188 },
    { concentration: 4, absorbance: 0.366 },
    { concentration: 6, absorbance: 0.541 },
    { concentration: 8, absorbance: 0.719 },
    { concentration: 10, absorbance: 0.895 },
  ];
  el.analyte.value = 'Cu²⁺ complex';
  el.wavelength.value = '620';
  el.pathLength.value = '1.00';
  el.unit.value = 'mg/L';
  el.unknownAbsorbance.value = '0.515';
  renderStandards();
  updateRegression();
}

el.standardsBody.addEventListener('input', event => {
  const input = event.target.closest('input[data-index]');
  if (!input) return;
  const index = Number(input.dataset.index);
  const field = input.dataset.field;
  state.standards[index][field] = finiteNumber(input.value);
  updateRegression();
});

el.standardsBody.addEventListener('click', event => {
  const button = event.target.closest('[data-remove]');
  if (!button) return;
  const index = Number(button.dataset.remove);
  state.standards.splice(index, 1);
  renderStandards();
  updateRegression();
});

el.addRowBtn.addEventListener('click', addStandard);
el.solveBtn.addEventListener('click', () => solveUnknown(true));
el.unknownAbsorbance.addEventListener('input', () => solveUnknown(false));
el.unit.addEventListener('change', () => { updateRegression(); el.unknownUnit.textContent = el.unit.value; });
el.exportBtn.addEventListener('click', exportCSV);
el.resetBtn.addEventListener('click', reset);
window.addEventListener('resize', drawChart);

renderStandards();
updateRegression();
