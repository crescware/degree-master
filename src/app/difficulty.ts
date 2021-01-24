import { SeriesOptions } from './series';
import { note, Tone } from './tone';

export const basic: SeriesOptions = {
  id: 'basic',
  coverage: [
    new Tone('c', 0),
    new Tone('e', 0),
    new Tone('g', 0),
    new Tone('c', 1),
  ],
  glossCount: Infinity,
  bottom: new Tone('b', -1),
  bpm: 120,
};

export const advanced: SeriesOptions = {
  id: 'advanced',
  coverage: [
    new Tone('c', 0),
    new Tone('d', 0),
    new Tone('e', 0),
    new Tone('f', 0),
    new Tone('g', 0),
    new Tone('a', 0),
    new Tone('b', 0),
    new Tone('c', 1),
  ],
  glossCount: Infinity,
  bottom: new Tone('b', -1),
  bpm: 125,
};

export const expert: SeriesOptions = {
  id: 'expert',
  coverage: [
    ...note.map((v) => new Tone(v, 0)),
    ...note.map((v) => new Tone(v, 1)),
  ].slice(0, 13),
  glossCount: Infinity,
  bottom: new Tone('b', -1),
  bpm: 130,
};

export const oniBasic: SeriesOptions = {
  ...basic,
  id: 'oniBasic',
  glossCount: 1,
};

export const oniAdvanced: SeriesOptions = {
  ...advanced,
  id: 'oniAdvanced',
  glossCount: 1,
};

export const oniExpert: SeriesOptions = {
  ...expert,
  id: 'oniExpert',
  glossCount: 1,
};
