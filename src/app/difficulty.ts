import { SeriesOptions } from './series';
import { allTones, Note, note, Tone } from './tone';

const majorScale = [2, 2, 1, 2, 2, 2, 1];
function buildCoverage(note: Note, scale: number[]) {
  const i = (() => {
    const i_ = allTones.findIndex((v) => v.isSameNote(note));
    if (['c', 'c#', 'd', 'd#', 'e'].includes(note)) {
      return i_ + 12;
    }
    return i_;
  })();
  const tones = allTones.slice(i);
  const indexes = scale.reduce((acc, v, i) => {
    if (i === 0) {
      return acc.concat(0).concat(v);
    }
    return acc.concat(acc[acc.length - 1] + v);
  }, [] as number[]);
  return indexes.map((i) => tones[i]);
}

export const basic: SeriesOptions = {
  id: 'basic',
  coverage: [
    new Tone('c', 0),
    new Tone('e', 0),
    new Tone('g', 0),
    new Tone('c', 1),
  ],
  glossCount: Infinity,
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
  bpm: 125,
};

export const expert: SeriesOptions = {
  id: 'expert',
  coverage: [
    ...note.map((v) => new Tone(v, 0)),
    ...note.map((v) => new Tone(v, 1)),
  ].slice(0, 13),
  glossCount: Infinity,
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

export const masterF: SeriesOptions = {
  id: 'master',
  coverage: buildCoverage('f', majorScale),
  glossCount: Infinity,
  bpm: 130,
};

export const masterFs: SeriesOptions = {
  id: 'master',
  coverage: buildCoverage('f#', majorScale),
  glossCount: Infinity,
  bpm: 130,
};

export const masterG: SeriesOptions = {
  id: 'master',
  coverage: buildCoverage('g', majorScale),
  glossCount: Infinity,
  bpm: 130,
};

export const masterGs: SeriesOptions = {
  id: 'master',
  coverage: buildCoverage('g#', majorScale),
  glossCount: Infinity,
  bpm: 130,
};

export const masterA: SeriesOptions = {
  id: 'master',
  coverage: buildCoverage('a', majorScale),
  glossCount: Infinity,
  bpm: 130,
};

export const masterAs: SeriesOptions = {
  id: 'master',
  coverage: buildCoverage('a#', majorScale),
  glossCount: Infinity,
  bpm: 130,
};

export const masterB: SeriesOptions = {
  id: 'master',
  coverage: buildCoverage('b', majorScale),
  glossCount: Infinity,
  bpm: 130,
};

export const masterC: SeriesOptions = {
  id: 'master',
  coverage: buildCoverage('c', majorScale),
  glossCount: Infinity,
  bpm: 130,
};

export const masterCs: SeriesOptions = {
  id: 'master',
  coverage: buildCoverage('c#', majorScale),
  glossCount: Infinity,
  bpm: 130,
};

export const masterD: SeriesOptions = {
  id: 'master',
  coverage: buildCoverage('d', majorScale),
  glossCount: Infinity,
  bpm: 130,
};

export const masterDs: SeriesOptions = {
  id: 'master',
  coverage: buildCoverage('d#', majorScale),
  glossCount: Infinity,
  bpm: 130,
};

export const masterE: SeriesOptions = {
  id: 'master',
  coverage: buildCoverage('e', majorScale),
  glossCount: Infinity,
  bpm: 130,
};
