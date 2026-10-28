import {LABEL_PRESETS, clampInteger, normalizePlants, makeLabelEntries, paginate, makeTrayCells, safeText} from './logic.mjs';
import {affiliateLinks, supportUrl} from './affiliate.js';

const $ = id => document.getElementById(id);
const formIds = ['crop','variety','sowDate','labelCount','note','preset','numbered','trayTitle','trayRows','trayCols','trayDate','trayPlants'];
let currentTab = 'labels';
let resizeObserver;
const formDefaults = Object.fromEntries(formIds.map(id=>[id, $(id).type === 'checkbox' ? $(id).checked : $(id).value]));

function formatDate(input) { return /^\d{4}-\d{2}-\d{2}$/.test(input) ? input.replace(/-/g,'.') : ''; }
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function makePaper(content, kind = 'labels') {
  const holder = el('div','paper-holder');
  const sheet = el('div',`print-sheet ${kind === 'tray' ? 'tray-paper' : ''}`);
  sheet.append(content);
  holder.append(sheet);
  return holder;
}
function makeLabelPage(entries, preset) {
  const grid = el('div',`print-grid ${preset.cols === 4 ? 'small-labels':''}`);
  grid.style.gridTemplateColumns = `repeat(${preset.cols},minmax(0,1fr))`;
  grid.style.gridTemplateRows = `repeat(${preset.rows},minmax(0,1fr))`;
  for (const item of entries) {
    const card = el('div','print-label');
    card.append(el('div','name',item.crop));
    if (item.variety) card.append(el('div','variety',item.variety));
    if (item.date) card.append(el('div','meta',item.date));
    if (item.note) card.append(el('div','meta',item.note));
    if (item.sequence) card.append(el('div','sequence',item.sequence));
    grid.append(card);
  }
  return makePaper(grid);
}
function makeTrayPage() {
  const wrap = el('div','tray-content');
  const title = el('div','tray-title');
  title.append(el('span','',safeText($('trayTitle').value,50) || '播種トレー配置図'));
  const date = formatDate($('trayDate').value);
  if (date) title.append(el('small','','種まき日 '+date));
  wrap.append(title);
  const rows = clampInteger($('trayRows').value,1,12,4);
  const cols = clampInteger($('trayCols').value,1,12,6);
  const grid = el('div','tray-grid');
  grid.style.gridTemplateColumns = `repeat(${cols},minmax(0,1fr))`;
  const heightMm = Math.min(207, Math.max(70, rows * 19));
  grid.style.height = `${heightMm}mm`;
  grid.style.gridTemplateRows = `repeat(${rows},minmax(0,1fr))`;
  for (const cell of makeTrayCells({rows,cols,plants:normalizePlants($('trayPlants').value)})) {
    const elem = el('div','tray-cell');
    elem.append(el('small','',`${cell.row}-${cell.col}`));
    if (cell.name) elem.append(el('span','',cell.name));
    grid.append(elem);
  }
  wrap.append(grid);
  wrap.append(el('p','tray-footer',`全${rows * cols}マス｜印刷後は自由に書き込んでください`));
  return makePaper(wrap,'tray');
}
function scalePreview() {
  const windowEl = $('previewWindow');
  const first = windowEl.querySelector('.print-sheet');
  if (!first) return;
  const fullWidth = first.offsetWidth; // 210mm in CSS pixels
  const available = Math.max(180, windowEl.clientWidth - (windowEl.clientWidth < 530 ? 12 : 30));
  const scale = Math.min(1, available / fullWidth);
  for (const holder of windowEl.querySelectorAll('.paper-holder')) {
    const paper = holder.querySelector('.print-sheet');
    const fullHeight = paper.offsetHeight;
    holder.style.width = `${fullWidth * scale}px`;
    holder.style.height = `${fullHeight * scale}px`;
    paper.style.transform = `scale(${scale})`;
  }
}
function render() {
  const area = $('printArea');
  area.replaceChildren();
  let sheets;
  if (currentTab === 'labels') {
    const preset = LABEL_PRESETS[$('preset').value] || LABEL_PRESETS.standard;
    const entries = makeLabelEntries({
      crop:$('crop').value, variety:$('variety').value,
      date:formatDate($('sowDate').value), note:$('note').value,
      count:$('labelCount').value, sequence:$('numbered').checked,
    });
    sheets = paginate(entries, preset.cols*preset.rows).map(page=>makeLabelPage(page,preset));
    $('status').textContent = `${entries.length}枚のラベルを作成しました。印刷画面でA4を選んでください。`;
  } else {
    sheets = [makeTrayPage()];
    const count = clampInteger($('trayRows').value,1,12,4)*clampInteger($('trayCols').value,1,12,6);
    $('status').textContent = `${count}マスの配置図を作成しました。`;
  }
  area.append(...sheets);
  $('pageCount').textContent = `A4 / ${sheets.length}ページ`;
  scalePreview();
}
function selectTab(type) {
  currentTab = type;
  for (const tab of document.querySelectorAll('[data-tab]')) {
    const active = tab.dataset.tab === type;
    tab.classList.toggle('is-active',active);
    tab.setAttribute('aria-selected',String(active));
    tab.tabIndex = active ? 0 : -1;
  }
  $('labelPanel').hidden = type !== 'labels';
  $('trayPanel').hidden = type !== 'tray';
  render();
}
function initMonetization() {
  const items = $('affiliateItems');
  // 安全上、HTTPSの正規のURLだけ表示。広告未設定では広告枠は非表示。
  for (const link of affiliateLinks.slice(0,3)) {
    try {
      const url = new URL(link.url);
      if (url.protocol !== 'https:') continue;
      const box = el('article','affiliate-item');
      const a = el('a','',safeText(link.title,70) || '関連する道具');
      a.href = url.href;
      a.target = '_blank'; a.rel = 'sponsored noopener noreferrer';
      box.append(a,el('p','',safeText(link.description,140)));
      items.append(box);
    } catch { /* malformed URL: skip */ }
  }
  $('affiliateSection').hidden = items.childElementCount === 0;
  try {
    const support = new URL(supportUrl);
    if (support.protocol === 'https:') {
      $('supportLink').href = support.href;
      $('supportLink').hidden = false;
    }
  } catch { /* not configured */ }
}

document.querySelectorAll('.controls form').forEach(form=>form.addEventListener('submit',event=>event.preventDefault()));
document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>selectTab(btn.dataset.tab)));
for (const id of formIds) $(id).addEventListener('input',render);
$('printBtn').addEventListener('click',()=>{
  render();
  window.print();
});
$('resetBtn').addEventListener('click',()=>{
  for (const id of formIds) $(id).type === 'checkbox' ? $(id).checked = formDefaults[id] : $(id).value = formDefaults[id];
  render();
});
if (typeof ResizeObserver !== 'undefined') {
  resizeObserver = new ResizeObserver(()=>scalePreview());
  resizeObserver.observe($('previewWindow'));
} else window.addEventListener('resize',scalePreview);
initMonetization();
render();
