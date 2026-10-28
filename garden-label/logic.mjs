export const LABEL_PRESETS = Object.freeze({
  standard: { cols: 3, rows: 10, name: '標準（3列 × 10行）' },
  wide: { cols: 2, rows: 6, name: '大きめ（2列 × 6行）' },
  small: { cols: 4, rows: 12, name: '小さめ（4列 × 12行）' },
});
export function clampInteger(value, min, max, fallback) {
  if (value === '' || value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : fallback;
}
export function safeText(value, maxLength = 120) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, maxLength);
}
export function normalizePlants(text) {
  return String(text ?? '').split(/[\n\r]+/).map(v => safeText(v, 48)).filter(Boolean).slice(0, 200);
}
export function makeLabelEntries({ crop, variety, date, note, count, sequence }) {
  const qty = clampInteger(count, 1, 240, 12);
  return Array.from({length: qty}, (_, i) => ({
    crop: safeText(crop, 32) || '植物名',
    variety: safeText(variety, 36),
    date: safeText(date, 32),
    note: safeText(note, 54),
    sequence: sequence ? `${i + 1} / ${qty}` : '',
  }));
}
export function paginate(list, perPage) {
  const size = clampInteger(perPage, 1, 200, 30);
  const result = [];
  for (let i = 0; i < list.length; i += size) result.push(list.slice(i, i + size));
  return result.length ? result : [[]];
}
export function makeTrayCells({rows, cols, plants}) {
  const r = clampInteger(rows, 1, 12, 4);
  const c = clampInteger(cols, 1, 12, 6);
  const names = Array.isArray(plants) ? plants.map(n=>safeText(n,48)).filter(Boolean) : normalizePlants(plants);
  return Array.from({length: r * c}, (_, index) => ({
    number: index + 1,
    row: Math.floor(index / c) + 1,
    col: index % c + 1,
    name: names.length ? names[index % names.length] : '',
  }));
}
