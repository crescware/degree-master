export const note = [
  'c',
  'c#',
  'd',
  'd#',
  'e',
  'f',
  'f#',
  'g',
  'g#',
  'a',
  'a#',
  'b',
] as const;
export type Note = typeof note[number];
export type Oct = -1 | 0 | 1;

export class Tone {
  constructor(readonly note: Note, readonly oct: Oct) {}

  eq(other: Tone): boolean {
    return [this.note === other.note, this.oct === other.oct].every((v) => v);
  }

  isSameNote(n: Note): boolean {
    return this.note === n;
  }

  isUpperKey(): boolean {
    return this.note.includes('#');
  }

  toString(): string {
    return [this.note, this.oct].join('');
  }
}

export const allTones = ([-1, 0, 1] as Oct[]).reduce((acc, oct) => {
  return acc.concat(
    ([
      'c',
      'c#',
      'd',
      'd#',
      'e',
      'f',
      'f#',
      'g',
      'g#',
      'a',
      'a#',
      'b',
    ] as Note[]).map((v) => new Tone(v, oct))
  );
}, [] as Tone[]);
