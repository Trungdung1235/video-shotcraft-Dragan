import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { loadRequest, totalFrames, validateRequest, within } from './headless-lib.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// A fixed fixture: real render/request.json changes with every user's storyboard.
const sample = { version: 1, prompt: 'Sample original-recipe film', title: 'Sample',
  images: [{ repo: 'template/public/textures/live/projects-full.png' }],
  shots: [{ recipe: 'tilt-reveal', image: 0, caption: 'Reveal' }, { recipe: 'drone-dive-landing', image: 0, caption: 'Dive' }] };
test('Storyboard uses complete original shot durations', () => {
  assert.equal(totalFrames(validateRequest(sample)), 225);
});
test('Reject absent assets, invented recipes, invalid image indices and ambiguous sources', () => {
  assert.throws(() => validateRequest({ ...sample, images: [] }), /accessible images/);
  assert.throws(() => validateRequest({ ...sample, shots: [{ recipe: 'fake-zoom', image: 0, caption: '' }] }), /Unsupported/);
  assert.throws(() => validateRequest({ ...sample, shots: [{ recipe: 'tilt-reveal', image: 9, caption: '' }] }), /unavailable/);
  assert.throws(() => validateRequest({ ...sample, images: [{ file: 'a.png', url: 'https://example.com/a.png' }] }), /exactly one/);
});
test('Remote sources can come from process-only URLs without changing committed request', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'shotcraft-source-'));
  try {
    const filename = path.join(dir, 'request.json');
    writeFileSync(filename, JSON.stringify(sample));
    const request = loadRequest(filename, { SHOTCRAFT_IMAGE_URLS: '["https://example.com/temporary.png?token=private"]' });
    assert.equal(request.images[0].url, 'https://example.com/temporary.png?token=private');
    assert.deepEqual(JSON.parse(readFileSync(filename, 'utf8')), sample);
  } finally { rmSync(dir, { recursive: true }); }
});
test('Repository input symlinks cannot escape the repository', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'shotcraft-path-'));
  try {
    symlinkSync(os.tmpdir(), path.join(dir, 'outside'));
    assert.throws(() => within(dir, path.join(dir, 'outside')), /escapes/);
  } finally { rmSync(dir, { recursive: true }); }
});
test('Missing attachment fails explicitly before rendering and cannot leave an old MP4', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'shotcraft-missing-'));
  try {
    const requestFile = path.join(dir, 'request.json');
    writeFileSync(requestFile, JSON.stringify({ ...sample, images: [{ file: 'missing-attachment.png' }] }));
    writeFileSync(path.join(dir, 'video.mp4'), 'stale successful output');
    const result = spawnSync(process.execPath, [path.join(repo, 'workbench/scripts/render-headless.mjs'), requestFile, dir], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Reference image 1 cannot be used by renderer/);
    assert.match(result.stderr, /No placeholder image/);
    assert.throws(() => readFileSync(path.join(dir, 'video.mp4')), /ENOENT/);
  } finally { rmSync(dir, { recursive: true }); }
});
test('GitHub runner refuses a Codex-only local attachment path', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'shotcraft-runner-'));
  try {
    const requestFile = path.join(dir, 'request.json');
    writeFileSync(requestFile, JSON.stringify({ ...sample, images: [{ file: path.join(repo, sample.images[0].repo) }] }));
    const result = spawnSync(process.execPath, [path.join(repo, 'workbench/scripts/render-headless.mjs'), requestFile, dir], { encoding: 'utf8', env: { ...process.env, GITHUB_ACTIONS: 'true' } });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /not accessible on a GitHub runner/);
  } finally { rmSync(dir, { recursive: true }); }
});
