# Codex Web: prompt + reference images → downloadable MP4

When the user requests a video, operate autonomously through delivery. Read
`render/README.md`. Do not open Motion Workbench, Studio, Preview or Codespaces.
Use original Video Shotcraft recipe implementations and the pinned Remotion
toolchain; do not replace their camera/motion with a generic slideshow.

1. Turn the prompt into `render/request.json`: concise title, captions, image
   indices and supported recipes. Read the exact recipe and TSX source. The
   initial headless adapters support `tilt-reveal` (120f) and
   `drone-dive-landing` (105f). To use another recipe, add an adapter to its actual
   source, preserving timing and easing; never silently substitute a recipe.
2. Resolve attachments to real readable files, not chat thumbnails or invented
   `/mnt/data` paths. Keep local inputs under ignored `render/private/` or `work/`.
   The render process must decode each source and finish Chromium's image
   preflight. If unavailable, identify the missing image and request a real
   PNG/JPEG/WebP attachment or a direct HTTPS download source.
3. GitHub-hosted runners cannot read Codex's local files. For private references
   obtain an already authorized temporary HTTPS download URL. Pass URLs through
   the `SHOTCRAFT_IMAGE_URLS` Actions secret, or dispatch inputs for public URLs.
   Never publish/upload an attachment to a public host, commit image bytes or
   signed/private URLs without the user's permission. Never invent an attachment
   transport. If only a local file exists, explain that source access blocks the
   Actions render; do the remaining work and ask for a runner-accessible source.
4. Run `node --test workbench/scripts/headless-checks.mjs`. Commit only reviewed
   code/request files, push a fresh `codex/render/<job-id>` branch, and prepare a
   PR; do not merge or change repository visibility/billing. Every future render
   branch must include this pipeline (until the setup PR is merged, branch from
   the setup branch). A changed `render/request.json` triggers rendering.
5. Follow the exact push-triggered Actions run for the pushed SHA, inspect errors
   and fix until successful. Use GitHub connector GET Actions runs if `gh` is
   unavailable. Confirm a non-expired artifact exists AND successfully download
   its ZIP. Inspect `video.mp4`, `qa.json`, `ffprobe.json`, contact sheet and image
   preflight. Original SKILL.md requires an independent final review for films.
6. Return the PR link, workflow run link and artifact download link. Tell the user
   to extract the ZIP and open `video.mp4`; artifacts expire after 7 days and
   require GitHub sign-in. Never report success from only a local `/workspace`
   path or a green job without a downloadable MP4. State any incomplete step.

Codex handles creative planning; Actions executes the resulting deterministic
storyboard. No paid model API, paid hosting or repository settings change is
needed. Do not promise that this thread's files/credentials persist into an
unrelated future Codex chat: open the repository or provide its name there.
