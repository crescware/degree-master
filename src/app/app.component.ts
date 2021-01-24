import { ChangeDetectorRef, Component } from '@angular/core';
import { takeUntil } from 'rxjs/operators';

import { MidiMediator } from './midi-mediator';
import { Series } from './series';
import { Synth } from './synth';
import { note, Tone } from './tone';

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

  constructor(readonly cd: ChangeDetectorRef, readonly midi: MidiMediator) {}

  ngOnInit(): void {
    this.synth = new Synth();
  }

  onClickStart(): void {
    this.activeTone = null;
    this.series = new Series();

    this.series.destroy$.subscribe(() => {
      this.wrong();
      this.midi.updateInput(null);
      this.cd.detectChanges(); // for MIDI
    });

    this.series.playTone$
      .pipe(takeUntil(this.series.destroy$))
      .subscribe((v) => this.play(v.tone, v.duration));

    this.coverage = [
      ...note.map((v) => [v, 0] as Tone),
      ...note.map((v) => [v, 1] as Tone),
    ].slice(0, 13);

    this.midi.noteNumber$
      .pipe(takeUntil(this.series.destroy$))
      .subscribe((v) => {
        switch (v) {
          case 60:
            this.triggerTone(['c', 0]);
            return;
          case 61:
            this.triggerTone(['c#', 0]);
            return;
          case 62:
            this.triggerTone(['d', 0]);
            return;
          case 63:
            this.triggerTone(['d#', 0]);
            return;
          case 64:
            this.triggerTone(['e', 0]);
            return;
          case 65:
            this.triggerTone(['f', 0]);
            return;
          case 66:
            this.triggerTone(['f#', 0]);
            return;
          case 67:
            this.triggerTone(['g', 0]);
            return;
          case 68:
            this.triggerTone(['g#', 0]);
            return;
          case 69:
            this.triggerTone(['a', 0]);
            return;
          case 70:
            this.triggerTone(['a#', 0]);
            return;
          case 71:
            this.triggerTone(['b', 0]);
            return;
          case 72:
            this.triggerTone(['c', 1]);
            return;
        }
      });

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

  onChangeMidiInput(ev: Event): void {
    const { target } = ev;
    if (target === null) {
      throw new Error('target should be found');
    }
    const optionEl = target as HTMLOptionElement;
    const value = JSON.parse(optionEl.value) as number | null;
    this.midi.updateInput(value);
  }

  onMousedown(tone: Tone | null): void {
    this.triggerTone(tone);
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

  private triggerTone(tone: Tone | null) {
    if (tone === null) {
      return; // noop
    }
    if (this.series === null) {
      throw new Error('Invalid game');
    }
    this.series.guess(tone);
  }

  private async play([n, oct]: Tone, duration: number): Promise<void> {
    this.activeTone = [n, oct];
    this.cd.detectChanges(); // for MIDI
    await this.synth?.play(freqArr[note.indexOf(n) + oct * 12], duration);

    requestAnimationFrame(() => {
      this.activeTone = null;
      this.cd.detectChanges(); // for MIDI
    });
  }

  private async wrong(): Promise<void> {
    await this.synth?.play(103.82, 100);
    await this.synth?.play(103.82, 600);
  }
}
