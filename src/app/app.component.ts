import { Component } from '@angular/core';
import { takeUntil } from 'rxjs/operators';

import { Series } from './series';
import { Synth } from './synth';
import { note, Note, Oct, Tone } from './tone';

const freqArr = [...Array(24)]
  .reduce((acc, _, i) => {
    return acc.concat(220 * 2 ** (i / 12));
  }, [] as number[])
  .slice(3, 3 + 13);

interface EnabledKeyViewModel {
  disabled: false;
  tone: Tone;
}

interface DisabledKeyViewModel {
  disabled: true;
  tone: null;
}

type KeyViewModel = EnabledKeyViewModel | DisabledKeyViewModel;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  synth: Synth | null = null;
  series: Series | null = null;
  activeTone: Tone | null = null;
  private coverage: Tone[] = [];

  ngOnInit(): void {
    this.synth = new Synth();
  }

  onClickStart(): void {
    this.activeTone = null;
    this.series = new Series();

    this.series.destroy$.subscribe(() => this.wrong());

    this.series.playTone$
      .pipe(takeUntil(this.series.destroy$))
      .subscribe((v) => this.play(v.tone, v.duration));

    this.coverage = [
      ...note.map((v) => [v, 0] as Tone),
      ...note.map((v) => [v, 1] as Tone),
    ].slice(0, 13);

    this.series.startSeries(this.coverage);
  }

  getCount(): number {
    return this.series?.getCount() ?? 0;
  }

  getScore(): number {
    return Math.max(0, this.getCount() - 1);
  }

  getUpperKeys(): KeyViewModel[] {
    const keys = this.coverage.filter((v) => {
      return ['c#', 'd#', 'f#', 'g#', 'a#'].includes(v[0]);
    });
    if (keys[0][0] === 'c#') {
      return [
        { disabled: true, tone: null },
        { disabled: true, tone: null },
        ...keys.reduce((acc, v): KeyViewModel[] => {
          if (v[0] === 'd#') {
            return acc.concat([
              { disabled: false, tone: v },
              { disabled: true, tone: null },
            ]);
          }
          return acc.concat({ disabled: false, tone: v });
        }, [] as KeyViewModel[]),
        { disabled: true, tone: null },
        { disabled: true, tone: null },
      ];
    }
    return [];
  }

  getLowerKeys(): KeyViewModel[] {
    const keys = this.coverage.filter((v) => {
      return ['c', 'd', 'e', 'f', 'g', 'a', 'b'].includes(v[0]);
    });
    if (keys[0][0] === 'c') {
      return [
        { disabled: true, tone: null },
        { disabled: true, tone: null },
        ...keys.map(
          (v): EnabledKeyViewModel => {
            return { disabled: false, tone: v };
          }
        ),
        { disabled: true, tone: null },
      ];
    }
    return [];
  }

  onMousedown(tone: Tone | null): void {
    if (tone === null) {
      return; // noop
    }
    if (this.series === null) {
      throw new Error('Invalid game');
    }
    this.series.guess(tone);
  }

  eqTone(a: Tone | null, b: Tone | null): boolean {
    if (a === null || b === null) {
      return false;
    }
    return a[0] === b[0] && a[1] === b[1];
  }

  trackBy(vm: KeyViewModel): string {
    return JSON.stringify(vm);
  }

  private async play([n, oct]: Tone, duration: number): Promise<void> {
    this.activeTone = [n, oct];
    await this.synth?.play(freqArr[note.indexOf(n) + oct * 12], duration);

    requestAnimationFrame(() => {
      this.activeTone = null;
    });
  }

  private async wrong(): Promise<void> {
    await this.synth?.play(103.82, 100);
    await this.synth?.play(103.82, 600);
  }
}
