# Codespaces Workbench validation

Validated on 2026-10-19 (Asia/Saigon), against source commit
`43bd349a136651865ecfa6ea1cf012f6e957d304` plus this change.

## Passed in the existing Linux environment

| Check | Result |
| --- | --- |
| Original library | 124 recipe files, 150 Gallery variants, 150 generated Workbench demo imports; no changes to recipes, demos, Gallery index, or template scene source |
| Clean dependency installation | Ran `.devcontainer/setup.sh`: `npm ci` at root, template and Workbench; generated links/index; used the original npm Remotion executable, without the environment's previous CLI wrapper |
| Startup | Ran `.devcontainer/start.sh`; Vite bound to `0.0.0.0:5198`; repeated start reused the same managed process |
| Fresh browser visit | `/` redirected to the original film import; Ink Press imported as 10 tracks / 52 clips |
| Preview and editing | Play/pause, Inspector text edit, autosave and reload preserved the edit |
| Project portability | Export JSON downloaded the edit; Import restored the original project |
| Full export through UI | Clicked Export video; rendered all 1,085 frames, H.264 1920×1080 at 30fps, AAC stereo 48kHz; about 20.3 MB |
| MP4 browser download | Clicked Download MP4; downloaded file SHA-256 matched the server output: `e1ac33eca305f1ecf799ecf1f83bb478f0ac874d5bb30815d4a9e5a798bd16a1` |
| Audio signal | Mean −25.1 dBFS, peak −2.2 dBFS; original SFX, no added BGM |
| Export lifecycle responses | Incomplete download returned 409; unknown job returned 404 |
| Host restrictions | Exact Codespaces hostname returned 200; another Codespaces hostname returned 403 for the page, root redirect and export download API |
| HTTPS proxy configuration | Verified the generated HMR configuration uses WSS, the exact Codespaces hostname, and external port 443; did not test GitHub's real proxy |
| Build and existing tests | Workbench TypeScript/Vite build; 23 helpers + 11 themes + 6 compatibility tests passed |
| Configuration tooling | Dev Containers CLI 0.89.0 read the configuration and lifecycle paths; shell/Node syntax checks and `git diff --check` passed |
| Debian packages | Confirmed all six explicitly requested packages exist in Debian Bookworm's package index, including `chromium-headless-shell` |

Browser checks used Playwright with real Chromium. The full export used Remotion
4.0.484, the existing Linux headless shell and the Codespaces configuration's
single render worker. The Linux test host ran Node 24.19; the proposed container
uses Node 22. These checks do not establish performance on a 2-core Codespaces VM.

The final host restriction was also tested against custom API routes, because
Vite plugin middleware runs before Vite's built-in hostname check.

## Not verified or blocked

- **Full Docker image build:** attempted, but the environment's outbound policy
  returned HTTP 403 for `westcentralus.data.mcr.microsoft.com` while resolving the
  Microsoft base-image layers. Did not bypass the policy. The Dockerfile has not
  completed an actual build here.
- **A real GitHub Codespace:** not created; therefore first boot on Node 22,
  authenticated Private port access, real HTTPS/WSS forwarding, account quota,
  machine allocation, and browser auto-open still need platform confirmation.
  This avoids starting a resource that could consume the user's Codespaces quota
  or incur charges without consent.
- **All 150 individual demo renders:** indexes and build were checked, not a new
  render of every variant. The 150 local Gallery preview MP4s are not installed;
  Workbench retains its original live Player fallback.
- **Public deployment, billing or prebuilds:** not configured or started. No
  account spending settings, repository visibility or port visibility were changed.
- **Build warning:** Vite reports a roughly 2.17 MB JavaScript bundle; the build
  succeeds. Complex live previews may be slower on small machines.

See [the Vietnamese browser guide](CODESPACES.vi.md) for the web-only startup,
Private-port check, JSON/MP4 download, stop/delete steps and billing references.
