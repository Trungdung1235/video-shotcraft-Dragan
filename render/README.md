# Codex Web → original Shotcraft recipes → MP4

Codex writes a storyboard from the prompt and reference images, pushes a
`codex/render/<job-id>` branch, follows Actions, downloads the artifact to verify
it, then returns the download link. No Workbench, Preview or Codespace is used.
Changes are reviewed through PRs, not written directly to `main`.

## What runs

`workbench/src/headless/index.tsx` directly imports the original `TiltReveal` and
`DroneDiveLanding` implementations through their content-injection exports.
The original zero-prop demos are preserved. Timing, camera paths, perspective,
motion blur, easing and light layers stay in the original TSX files. The initial
supported recipes are `tilt-reveal` (120 frames) and `drone-dive-landing` (105).
Codex can add further original recipe adapters in a PR when a prompt needs them.

`render/request.json` is the committed storyboard, not an LLM endpoint. Codex
does the prompt interpretation before pushing; manual Actions dispatch rerenders
the storyboard, with optional prompt/title and image source overrides.

## Image access and privacy

Source objects support exactly one field:

- `{"repo":"template/public/textures/live/projects-full.png"}`: an existing
  repository sample, resolved against the repository root.
- `{"file":"reference.png"}`: local path relative to the request JSON (or an
  absolute path). For local testing only; refused on a GitHub-hosted runner.
- `{"env":"SHOTCRAFT_IMAGE_1_URL"}`: an HTTPS URL supplied to the local process.
- `{"url":"https://…"}`: direct HTTPS source. Keep private/signed URLs only in
  ignored local request files, never commit them.

`SHOTCRAFT_IMAGE_URLS` overrides all image sources with a JSON array of URLs in
the same order, keeping the storyboard's image indices. On Actions, configure
this as a repository Actions secret for private URLs. Do not put private URLs
in workflow_dispatch inputs: event inputs may be visible to repository readers.
The workflow never prints the URL values and only uploads normalized image
preflight/output frames, not the source files. Anyone who can download a film
can of course see the reference image in that film.

For a URL already authorized for runner use, Codex can set the secret using
`gh secret set SHOTCRAFT_IMAGE_URLS --repo Trungdung1235/video-shotcraft-Dragan`
with the JSON on standard input (never interpolate it into a shell command).
Only use that command when the active GitHub connection supports secrets writes.
The current GitHub connector's repository tools do not provide secret creation
or workflow dispatch; Git pushes and push-triggered rendering need neither.
Do not print or request tokens in chat. The setup sample needs no secret.

A Codex chat attachment is **not automatically accessible to GitHub Actions**.
If there is no actual readable file in Codex, ask to attach a real PNG/JPEG/WebP.
If it exists only locally, request a direct temporary HTTPS download URL or an
already configured private asset source. There is no automatic public-upload
fallback. This is an explicit input failure, not a successful video job.

Inputs are limited to 8 images, 20 MiB/40 megapixels per source. FFprobe inspects
each image, FFmpeg decodes it to PNG, and Chromium must load every image in
`AssetPreflight` before rendering. A missing source aborts without placeholders.

## Run and deliver

For local diagnostics (not required from the user):

```sh
npm ci --prefix workbench
node --test workbench/scripts/headless-checks.mjs
node workbench/scripts/render-headless.mjs render/request.json work/render-output
```

FFmpeg/ffprobe must be installed. Optionally set
`REMOTION_BROWSER_EXECUTABLE=/usr/bin/chromium`; otherwise Remotion downloads its
matching headless browser. All intermediates and private sources are ignored by
Git. The final output is H.264/yuv420p MP4, BT.709 limited range, 1920×1080, 30fps, with audible AAC
sound effects from the original repository. No BGM or paid audio generation is
required. For custom narration/music, add an explicit audio source/track in a PR.

The workflow runs on pushes touching the request/pipeline on `codex/render/**`.
Manual `workflow_dispatch` is also declared; GitHub normally exposes the Run
workflow button after this workflow reaches the default branch. Before merging,
use a push to the render branch. No settings or billing changes are automated.

Verification requires correct codec, dimensions, fps, exact frame count and
duration, AAC track duration, non-silent sound, non-black pictures and a full
FFmpeg decode. A failed run removes any old MP4 and cannot reach artifact upload.
Every successful run uploads `shotcraft-mp4-<run-id>-<attempt>` for **7 days**:

- `video.mp4`: the finished film.
- `qa.json`, `ffprobe.json`: machine-readable verification.
- `contact-sheet.jpg`, `asset-preflight.png`: picture/asset evidence.

Return `https://github.com/Trungdung1235/video-shotcraft-Dragan/actions/runs/<id>`
and the actual artifact URL from that run. Sign in to GitHub, select the artifact
under **Artifacts**, extract the ZIP and use **video.mp4**. The artifact link is
access-controlled and expires; it is not an anonymous permanent MP4 host.

Future user message example: “Dùng Trungdung1235/video-shotcraft-Dragan tạo video
giới thiệu từ prompt sau và các ảnh đính kèm; tự render và trả link MP4.” Codex
follows AGENTS.md, checks source availability, and handles production/delivery.
