import { SeriesOptions } from './series';
import { note, Tone } from './tone';

export const basic: SeriesOptions = {
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
  coverage: [
    ...note.map((v) => new Tone(v, 0)),
    ...note.map((v) => new Tone(v, 1)),
  ].slice(0, 13),
  glossCount: Infinity,
  bottom: new Tone('b', -1),
  bpm: 130,
};
