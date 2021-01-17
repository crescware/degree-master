import { Component } from '@angular/core';
import { takeUntil, takeWhile } from 'rxjs/operators';

import { note, Note, Oct, Series, Tone } from './series';
import { Synth } from './synth';

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
  series: Series | null = null;

  ngOnInit() {
    this.synth = new Synth();
  }

  onClickStart() {
    this.series = new Series();

    this.series.destroy$.subscribe(() => {
      this.wrong();
    });

    this.series.playTone$
      .pipe(takeUntil(this.series.destroy$))
      .subscribe((v) => this.play(v.tone, v.duration));

    this.series.startSeries();
  }

  getCount(): number {
    return this.series?.getCount() ?? 0;
  }

  async onMousedown(n: Note, oct: Oct) {
    if (this.series === null) {
      throw new Error('Invalid game');
    }
    this.series.guess(n, oct);
  }

  private async play([n, oct]: Tone, duration: number): Promise<void> {
    await this.synth?.play(freqArr[note.indexOf(n) + oct * 12], duration);
  }
  private async wrong(): Promise<void> {
    await this.synth?.play(103.82, 100);
    await this.synth?.play(103.82, 600);
  }
}
