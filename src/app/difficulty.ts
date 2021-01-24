import { note, Tone } from './tone';

export const basic = {
  coverage: [
    new Tone('c', 0),
    new Tone('e', 0),
    new Tone('g', 0),
    new Tone('c', 1),
  ],
  glossCount: Infinity,
  bottom: new Tone('b', -1),
};

export const advanced = {
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
};

export const expert = {
  coverage: [
    ...note.map((v) => new Tone(v, 0)),
    ...note.map((v) => new Tone(v, 1)),
  ].slice(0, 13),
  glossCount: Infinity,
  bottom: new Tone('b', -1),
};
