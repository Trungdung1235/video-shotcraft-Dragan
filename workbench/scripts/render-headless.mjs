#!/usr/bin/env node
import { access, copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { bundle } from '@remotion/bundler';
import { openBrowser, renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { loadRequest, totalFrames, within } from './headless-lib.mjs';

const wb = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.dirname(wb);
const requestPath = path.resolve(process.argv[2] ?? path.join(repo, 'render/request.json'));
const output = path.resolve(process.argv[3] ?? path.join(repo, 'work/render-output'));
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error?.message ?? result.stderr}`);
  return result.stdout;
};
const probe = (filename) => JSON.parse(run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', filename]));

async function download(urlString) {
  let url;
  try { url = new URL(urlString); } catch { throw new Error('Image URL is invalid'); }
  for (let redirect = 0; redirect <= 4; redirect++) {
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Image source must be a direct HTTPS URL without embedded credentials');
    let response;
    try { response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30000) }); }
    catch { throw new Error('Image download failed; supply an accessible file or direct HTTPS download URL'); }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location) throw new Error('Image redirect has no destination');
      url = new URL(location, url);
      continue;
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`Image download returned HTTP ${response.status}; use a direct URL that the runner can access`); }
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > 20 * 1024 * 1024) throw new Error('Image exceeds 20 MiB');
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
  throw new Error('Too many image redirects');
}

let browser;
let stage;
try {
  const request = loadRequest(requestPath);
  const work = path.join(repo, 'work');
  await mkdir(work, { recursive: true });
  await mkdir(output, { recursive: true });
  // A failed rerun must never leave an older video looking like a successful result.
  for (const name of ['video.mp4', 'qa.json', 'ffprobe.json', 'contact-sheet.jpg', 'asset-preflight.png']) await rm(path.join(output, name), { force: true });
  stage = await mkdtemp(path.join(work, 'headless-'));
  const publicDir = path.join(stage, 'public');
  await mkdir(path.join(publicDir, 'images'), { recursive: true });
  await mkdir(path.join(publicDir, 'audio'), { recursive: true });
  const images = [];
  const inputChecks = [];
  for (const [index, image] of request.images.entries()) {
    const raw = path.join(stage, `input-${index}`);
    try {
      if (image.url || image.env) {
        const url = image.url ?? process.env[image.env];
        if (!url) throw new Error(`Image source ${image.env} is unavailable to this process`);
        await writeFile(raw, await download(url));
      } else {
        if (process.env.GITHUB_ACTIONS && image.file) throw new Error('A Codex local file is not accessible on a GitHub runner; use an HTTPS source via workflow inputs or an Actions secret');
        const source = image.repo ? within(repo, path.resolve(repo, image.repo)) : path.resolve(path.dirname(requestPath), image.file);
        await access(source, constants.R_OK);
        if ((await stat(source)).size > 20 * 1024 * 1024) throw new Error('Image exceeds 20 MiB');
        await copyFile(source, raw);
      }
      const info = probe(raw).streams.find((stream) => stream.codec_type === 'video');
      if (!info || !['png', 'mjpeg', 'webp'].includes(info.codec_name) || info.width * info.height > 40000000)
        throw new Error('Use a PNG, JPEG or WebP image under 40 megapixels');
      const name = `images/reference-${index}.png`;
      run('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-frames:v', '1', path.join(publicDir, name)]);
      images.push(name);
      inputChecks.push({ index, width: info.width, height: info.height, sha256: createHash('sha256').update(await readFile(raw)).digest('hex'), readable: true });
    } catch (error) {
      throw new Error(`Reference image ${index + 1} cannot be used by renderer: ${error.message}. Attach a real PNG/JPEG/WebP accessible in Codex; for Actions supply a direct HTTPS URL via image_urls/SHOTCRAFT_IMAGE_URLS. No placeholder image is substituted.`);
    }
  }
  await copyFile(path.join(repo, 'template/public/audio/whoosh-big.mp3'), path.join(publicDir, 'audio/whoosh.mp3'));
  await copyFile(path.join(repo, 'template/public/audio/transition-snap.mp3'), path.join(publicDir, 'audio/land.mp3'));
  const props = { title: request.title, shots: request.shots, images };
  const serveUrl = await bundle({ entryPoint: path.join(wb, 'src/headless/index.tsx'), publicDir,
    outDir: path.join(stage, 'bundle'), webpackOverride: (config) => ({ ...config,
      resolve: { ...config.resolve, symlinks: false, alias: { ...config.resolve?.alias, '@demos': path.join(repo, 'demos') },
        modules: [path.join(wb, 'node_modules'), 'node_modules'] } }) });
  browser = await openBrowser('chrome', { browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || undefined });
  const common = { serveUrl, inputProps: props, puppeteerInstance: browser };
  const preflight = await selectComposition({ ...common, id: 'AssetPreflight' });
  await renderStill({ ...common, composition: preflight, frame: 0, timeoutInMilliseconds: 120000,
    imageFormat: 'png', output: path.join(output, 'asset-preflight.png') });
  const composition = await selectComposition({ ...common, id: 'HeadlessFilm' });
  if (composition.durationInFrames !== totalFrames(request)) throw new Error('Original recipe duration mismatch');
  let last = -1;
  await renderMedia({ ...common, composition, codec: 'h264', audioCodec: 'aac', pixelFormat: 'yuv420p', colorSpace: 'bt709', crf: 18,
    concurrency: 2, timeoutInMilliseconds: 120000, outputLocation: path.join(output, 'video.mp4'),
    onProgress: ({ progress }) => { const pct = Math.floor(progress * 10) * 10; if (pct !== last) { console.log(`Render ${pct}%`); last = pct; } } });
  run(process.execPath, [path.join(wb, 'scripts/verify-headless.mjs'), path.join(output, 'video.mp4'), String(totalFrames(request)), output]);
  const report = JSON.parse(await readFile(path.join(output, 'qa.json'), 'utf8'));
  report.referenceImages = inputChecks;
  report.chromiumImagePreflight = 'passed';
  report.recipes = request.shots.map(({ recipe }) => recipe);
  await writeFile(path.join(output, 'qa.json'), JSON.stringify(report, null, 2));
  console.log(`VERIFIED: ${totalFrames(request)} frames, H.264 1920x1080 30fps + AAC. video.mp4 ready.`);
} catch (error) {
  await rm(path.join(output, 'video.mp4'), { force: true }).catch(() => {});
  // Request URLs and private paths must not leak into public Actions logs.
  console.error(String(error.message).replace(/https?:\/\/[^\s]+/g, '[source URL redacted]'));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close({ silent: true });
  if (stage) await rm(stage, { recursive: true, force: true });
}
