import React from 'react';
import { AbsoluteFill, Audio, Composition, Img, Sequence, registerRoot, staticFile } from 'remotion';
import { TiltRevealWithContent, TILT_REVEAL_DURATION } from '@demos/camera/overhead-camera-moves/TiltReveal';
import { DroneDiveLandingWithContent, DRONE_DIVE_LANDING_DURATION } from '@demos/camera/space-camera-moves/DroneDiveLanding';

type Shot = { recipe: 'tilt-reveal' | 'drone-dive-landing'; image: number; caption: string };
type Props = { title: string; images: string[]; shots: Shot[] };
const durations = { 'tilt-reveal': TILT_REVEAL_DURATION, 'drone-dive-landing': DRONE_DIVE_LANDING_DURATION };
const durationOf = (shots: Shot[]) => shots.reduce((total, shot) => total + durations[shot.recipe], 0);
const picture = (src: string, style: React.CSSProperties = {}) => (
  <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'contain', ...style }} />
);

const Film: React.FC<Props> = ({ title, images, shots }) => {
  let start = 0;
  return <AbsoluteFill style={{ background: '#101626' }}>
    {shots.map((shot, index) => {
      const from = start;
      const duration = durations[shot.recipe];
      start += duration;
      const src = images[shot.image];
      return <Sequence key={index} from={from} durationInFrames={duration}>
        {shot.recipe === 'tilt-reveal'
          ? <TiltRevealWithContent content={<AbsoluteFill style={{ background: '#101626' }}>{picture(src)}</AbsoluteFill>} />
          : <DroneDiveLandingWithContent content={<AbsoluteFill style={{ background: '#101626' }}>
              {picture(src, { opacity: 0.16 })}
              {/* Original recipe's focal card (518,335); preserve the camera trajectory. */}
              <div style={{ position: 'absolute', left: 256, top: 108, width: 524, height: 454,
                borderRadius: 16, overflow: 'hidden', background: '#101626' }}>{picture(src)}</div>
            </AbsoluteFill>} />}
        <div style={{ position: 'absolute', left: 100, right: 100, bottom: 48, padding: '18px 30px',
          borderRadius: 12, background: 'rgba(8,12,22,0.88)', color: 'white', fontFamily: 'Arial, sans-serif',
          fontSize: 60, fontWeight: 600, textAlign: 'center', overflowWrap: 'anywhere' }}>{shot.caption || title}</div>
        <Sequence from={shot.recipe === 'tilt-reveal' ? 20 : 24} durationInFrames={Math.min(50, duration - 24)}>
          <Audio src={staticFile('audio/whoosh.mp3')} volume={0.32} />
        </Sequence>
        <Sequence from={shot.recipe === 'tilt-reveal' ? 70 : 69} durationInFrames={30}>
          <Audio src={staticFile('audio/land.mp3')} volume={0.38} />
        </Sequence>
      </Sequence>;
    })}
  </AbsoluteFill>;
};

// Every Img must decode in Chromium before the renderer can finish this still.
const AssetPreflight: React.FC<Props> = ({ images }) => <AbsoluteFill style={{ background: '#202020', flexDirection: 'row' }}>
  {images.map((src) => <div key={src} style={{ flex: 1, minWidth: 0 }}>{picture(src)}</div>)}
</AbsoluteFill>;
const defaults: Props = { title: 'Shotcraft', images: [], shots: [{ recipe: 'tilt-reveal', image: 0, caption: '' }] };
const Root: React.FC = () => <>
  <Composition id="HeadlessFilm" component={Film} width={1920} height={1080} fps={30}
    durationInFrames={120} defaultProps={defaults}
    calculateMetadata={({ props }) => ({ durationInFrames: durationOf(props.shots) })} />
  <Composition id="AssetPreflight" component={AssetPreflight} width={1920} height={1080} fps={30}
    durationInFrames={1} defaultProps={defaults} />
</>;
registerRoot(Root);
