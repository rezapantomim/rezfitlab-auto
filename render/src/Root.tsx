import React from 'react';
import { Composition, Still } from 'remotion';
import { Episode } from './Episode';
import { Thumb } from './Thumb';
import { sample } from './sample';
import type { Props } from './types';

const meta = ({ props }: { props: Props }) => ({
  durationInFrames: Math.max(30, props.durationInFrames),
  fps: props.fps,
  width: props.width,
  height: props.height,
});

export const Root: React.FC = () => (
  <>
    <Composition id="Long" component={Episode as any} defaultProps={sample('long') as any} calculateMetadata={meta as any}
      durationInFrames={300} fps={30} width={1920} height={1080} />
    <Composition id="Short" component={Episode as any} defaultProps={sample('short') as any} calculateMetadata={meta as any}
      durationInFrames={300} fps={30} width={1080} height={1920} />
    <Still id="Thumb" component={Thumb as any} defaultProps={sample('long') as any} width={1280} height={720} />
  </>
);
