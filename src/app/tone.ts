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
export type Oct = 0 | 1;
export type Tone = [Note, Oct];
