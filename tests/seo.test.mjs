import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root = resolve(import.meta.dirname ?? new URL('.', import.meta.url).pathname, '..');
const file = path => readFileSync(resolve(root, path), 'utf8');
const base = 'https://first-test-web.pages.dev/garden-label/';

test('tool and guide have unique titles, descriptions, and canonical URLs', () => {
  const home = file('garden-label/index.html');
  const guide = file('garden-label/guide.html');
  for (const html of [home, guide]) {
    assert.match(html, /<html lang="ja">/);
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]+">/);
    assert.match(html, /<h1[ >]/);
  }
  assert.match(home, new RegExp('<link rel="canonical" href="' + base.replaceAll('.', '\\.') + '">'));
  assert.ok(guide.includes('<link rel="canonical" href="' + base + 'guide.html">'));
  assert.ok(!/<meta name="robots" content="noindex/.test(guide));
});

test('guide is visible from the tool, links back and is in sitemap', () => {
  const home = file('garden-label/index.html');
  const guide = file('garden-label/guide.html');
  const sitemap = file('sitemap.xml');
  assert.ok(home.includes('href="./guide.html"'));
  assert.ok(guide.includes('href="./#tool"'));
  assert.ok(guide.includes('href="./privacy.html"'));
  assert.ok(sitemap.includes('<loc>' + base + 'guide.html</loc>'));
  assert.ok(sitemap.includes('<loc>' + base + '</loc>'));
});

test('local references in the guide point to available files', () => {
  const guide = file('garden-label/guide.html');
  for (const match of guide.matchAll(/(?:href|src)="(\.\/[^"#?]*)(?:[#?][^"]*)?"/g)) {
    const target = match[1];
    const local = target === './' ? 'garden-label/index.html' : 'garden-label/' + target.slice(2);
    assert.ok(existsSync(resolve(root, local)), 'Missing ' + local);
  }
});

test('affiliate disclosure remains present in main tool', () => {
  const home = file('garden-label/index.html');
  assert.ok(home.includes('広告・PR'));
  assert.ok(home.includes('id="affiliateItems"'));
});
