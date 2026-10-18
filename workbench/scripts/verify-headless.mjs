#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const [video, frameArg, outputArg] = process.argv.slice(2);
const frames = Number(frameArg);
if (!video || !Number.isInteger(frames) || frames < 1) throw new Error('Usage: verify-headless.mjs video.mp4 expectedFrames outputDirectory');
const output = path.resolve(outputArg ?? path.dirname(video));
mkdirSync(output, { recursive: true });
function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error?.message ?? result.stderr}`);
  return result;
}
const info = JSON.parse(run('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', video]).stdout);
const v = info.streams.find((stream) => stream.codec_type === 'video');
const a = info.streams.find((stream) => stream.codec_type === 'audio');
const expectedDuration = frames / 30;
if (!v || v.codec_name !== 'h264' || v.width !== 1920 || v.height !== 1080 || v.avg_frame_rate !== '30/1' || v.pix_fmt !== 'yuv420p' || Number(v.nb_read_frames) !== frames)
  throw new Error('Video codec, dimensions, fps, pixel format or frame count failed verification');
if (!a || a.codec_name !== 'aac' || Math.abs(Number(a.duration) - expectedDuration) > 0.15)
  throw new Error('Missing AAC audio or incorrect audio duration');
if (Math.abs(Number(info.format.duration) - expectedDuration) > 0.15) throw new Error('Incorrect MP4 duration');
// Decode EVERY frame/sample, then inspect picture levels and sound energy.
run('ffmpeg', ['-v', 'error', '-xerror', '-i', video, '-f', 'null', '-']);
const signal = run('ffmpeg', ['-hide_banner', '-i', video, '-vf', 'signalstats,metadata=print', '-an', '-f', 'null', '-']).stderr;
const yValues = [...signal.matchAll(/lavfi.signalstats.YAVG=([\d.]+)/g)].map((match) => Number(match[1]));
if (!yValues.length || Math.max(...yValues) < 22) throw new Error('Rendered pictures are blank/black');
const sound = run('ffmpeg', ['-hide_banner', '-i', video, '-vn', '-af', 'volumedetect', '-f', 'null', '-']).stderr;
const peak = Number(/max_volume:\s*(-?[\d.]+) dB/.exec(sound)?.[1]);
if (!Number.isFinite(peak) || peak < -60) throw new Error('Audio stream is silent');
run('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vf', `fps=${6 / expectedDuration},scale=640:360,tile=3x2`, '-frames:v', '1', path.join(output, 'contact-sheet.jpg')]);
writeFileSync(path.join(output, 'ffprobe.json'), JSON.stringify(info, null, 2));
writeFileSync(path.join(output, 'qa.json'), JSON.stringify({ passed: true, video: { codec: v.codec_name, width: v.width, height: v.height, fps: v.avg_frame_rate, frames, duration: Number(info.format.duration) },
  audio: { codec: a.codec_name, channels: a.channels, duration: Number(a.duration), peakDb: peak },
  fullDecode: 'passed', pictureLumaRange: [Math.min(...yValues), Math.max(...yValues)] }, null, 2));
console.log('ffprobe, full decode, picture and audible audio checks passed');
