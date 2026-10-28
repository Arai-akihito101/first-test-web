import test from 'node:test';
import assert from 'node:assert/strict';
import { clampInteger, safeText, makeLabelEntries, makeTrayCells, paginate, normalizePlants, LABEL_PRESETS } from '../garden-label/logic.mjs';

test('input is bounded and empty numbers default safely', () => {
  assert.equal(clampInteger('',1,100,10),10);
  assert.equal(clampInteger('200',1,100,10),100);
  assert.equal(clampInteger('-2',1,100,10),1);
  assert.equal(clampInteger('invalid',1,100,10),10);
  assert.equal(clampInteger('3.9',1,100,10),3);
});
test('labels are repeated correctly and capped', () => {
  assert.equal(makeLabelEntries({crop:'トマト',count:500,sequence:true}).length,240);
  const labels = makeLabelEntries({crop:' バジル ',count:2,sequence:true, variety:'スイート',date:'2026.04.01'});
  assert.equal(labels[0].crop,'バジル');
  assert.equal(labels[0].sequence,'1 / 2');
  assert.equal(labels[1].sequence,'2 / 2');
});
test('page counts match A4 templates', () => {
  for (const preset of Object.values(LABEL_PRESETS)) {
    const entries = makeLabelEntries({crop:'花',count:240});
    assert.equal(paginate(entries,preset.cols*preset.rows).flat().length,240);
  }
  assert.equal(paginate(Array.from({length:31},(_,i)=>i),30).length,2);
});
test('tray layout assigns plant names predictably', () => {
  const cells = makeTrayCells({rows:2,cols:3,plants:'トマト\nナス'});
  assert.deepEqual(cells.map(c=>c.name),['トマト','ナス','トマト','ナス','トマト','ナス']);
  assert.equal(cells[5].row,2);
  assert.equal(cells[5].col,3);
});
test('unsafe control chars are stripped; text is bounded', () => {
  assert.equal(safeText(' hi\u0000\u0007 ',10),'hi');
  assert.equal(normalizePlants(' a\n\nb \n').length,2);
  assert.equal(safeText('abc',2),'ab');
});
