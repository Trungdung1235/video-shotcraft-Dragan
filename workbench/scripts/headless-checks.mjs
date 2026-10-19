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
test('MP4 verifier accepts limited-range H.264 with audio and rejects full-range or missing audio', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'shotcraft-output-'));
  const ffmpeg = (args) => {
    const result = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.error?.message ?? result.stderr);
  };
  const verify = (file, name) => spawnSync(process.execPath,
    [path.join(repo, 'workbench/scripts/verify-headless.mjs'), file, '9', path.join(dir, name)], { encoding: 'utf8' });
  try {
    // A codec test pattern only; production pictures always come from original recipes.
    const valid = path.join(dir, 'valid.mp4');
    ffmpeg(['-f', 'lavfi', '-i', 'testsrc2=size=1920x1080:rate=30', '-f', 'lavfi', '-i', 'sine=frequency=880:sample_rate=48000',
      '-t', '0.3', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709',
      '-color_trc', 'bt709', '-color_range', 'tv', '-c:a', 'aac', valid]);
    const passed = verify(valid, 'valid-qa');
    assert.equal(passed.status, 0, passed.stderr);
    assert.equal(JSON.parse(readFileSync(path.join(dir, 'valid-qa/qa.json'), 'utf8')).passed, true);
    const fullRange = path.join(dir, 'full-range.mp4');
    ffmpeg(['-i', valid, '-c', 'copy', '-bsf:v', 'h264_metadata=video_full_range_flag=1', fullRange]);
    const rejectedRange = verify(fullRange, 'range-qa');
    assert.equal(rejectedRange.status, 1);
    assert.match(rejectedRange.stderr, /yuvj420p/);
    const noAudio = path.join(dir, 'no-audio.mp4');
    ffmpeg(['-i', valid, '-c:v', 'copy', '-an', noAudio]);
    const rejectedAudio = verify(noAudio, 'audio-qa');
    assert.equal(rejectedAudio.status, 1);
    assert.match(rejectedAudio.stderr, /Missing AAC audio/);
  } finally { rmSync(dir, { recursive: true }); }
});
