import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer('angle');
Config.setConcurrency(process.env.CODESPACES === 'true' ? 1 : 4);
if (process.env.SHOTCRAFT_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.SHOTCRAFT_BROWSER_EXECUTABLE);
}
