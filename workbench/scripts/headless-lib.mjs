import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';

export const RECIPES = Object.freeze({ 'tilt-reveal': 120, 'drone-dive-landing': 105 });
export const FPS = 30;
export function validateRequest(request) {
  if (request?.version !== 1) throw new Error('request.version must be 1');
  if (typeof request.prompt !== 'string' || !request.prompt.trim() || request.prompt.length > 8000)
    throw new Error('A nonempty prompt (up to 8000 characters) is required');
  if (typeof request.title !== 'string' || !request.title.trim() || request.title.length > 120)
    throw new Error('A title of 1–120 characters is required');
  if (!Array.isArray(request.images) || !request.images.length || request.images.length > 8)
    throw new Error('Provide 1–8 accessible images; a chat thumbnail is not a renderer file');
  for (const image of request.images) {
    if (!image || typeof image !== 'object') throw new Error('Invalid image source');
    const keys = ['repo', 'file', 'url', 'env'].filter((key) => typeof image[key] === 'string' && image[key]);
    if (keys.length !== 1) throw new Error('Each image needs exactly one repo, file, url or env source');
    if (keys[0] === 'env' && !/^[A-Z][A-Z0-9_]*$/.test(image.env)) throw new Error('Invalid image environment variable');
  }
  if (!Array.isArray(request.shots) || !request.shots.length || request.shots.length > 30)
    throw new Error('Provide 1–30 shots selected by Codex from the supported original recipes');
  for (const shot of request.shots) {
    if (!Object.hasOwn(RECIPES, shot.recipe)) throw new Error(`Unsupported original recipe: ${shot.recipe}`);
    if (!Number.isInteger(shot.image) || shot.image < 0 || shot.image >= request.images.length)
      throw new Error('Shot refers to an unavailable image');
    if (typeof shot.caption !== 'string' || shot.caption.length > 160) throw new Error('Caption must be at most 160 characters');
  }
  return request;
}
export function within(root, candidate) {
  const resolved = realpathSync(candidate);
  const rel = path.relative(realpathSync(root), resolved);
  if (rel.startsWith(`..${path.sep}`) || rel === '..' || path.isAbsolute(rel)) throw new Error('Repository image escapes repository');
  return resolved;
}
export function loadRequest(filename, env = process.env) {
  const request = JSON.parse(readFileSync(filename, 'utf8'));
  if (env.SHOTCRAFT_PROMPT) {
    request.prompt = env.SHOTCRAFT_PROMPT;
    request.title = env.SHOTCRAFT_PROMPT.slice(0, 120);
    request.shots = request.shots.map((shot) => ({ ...shot, caption: request.title }));
  }
  if (env.SHOTCRAFT_IMAGE_URLS) {
    const urls = JSON.parse(env.SHOTCRAFT_IMAGE_URLS);
    if (!Array.isArray(urls) || !urls.length || urls.some((url) => typeof url !== 'string')) throw new Error('SHOTCRAFT_IMAGE_URLS must be a JSON array of HTTPS URLs');
    request.images = urls.map((url) => ({ url }));
  }
  return validateRequest(request);
}
export const totalFrames = (request) => request.shots.reduce((total, shot) => total + RECIPES[shot.recipe], 0);
