import { Component } from '@angular/core';

import { Synth } from './synth';

const note = [
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
type Note = typeof note[number];

const freqArr = [...Array(24)]
  .reduce((acc, _, i) => {
    return acc.concat(220 * 2 ** (i / 12));
  }, [] as number[])
  .slice(3, 3 + 13);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  synth: Synth | null = null;

  onClickStart() {
    this.synth = new Synth();
  }

  onMousedown(n: Note, oct: 0 | 1) {
    this.synth?.play(freqArr[note.indexOf(n) + oct * 12], 300);
  }
}
