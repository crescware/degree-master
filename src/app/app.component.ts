import { ChangeDetectorRef, Component } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import * as UAParser from 'ua-parser-js';

import { MidiMediator } from './midi-mediator';
import { Series, SeriesOptions } from './series';
import { Synth } from './synth';
import { allTones, note, Tone } from './tone';

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
  activeTone: Tone | null = null;
  isPlaying = false;

  readonly basic = {
    coverage: [
      new Tone('c', 0),
      new Tone('e', 0),
      new Tone('g', 0),
      new Tone('c', 1),
    ],
    // coverage,
    glossCount: Infinity,
    bottom: new Tone('b', -1),
  };

  readonly advanced = {
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
    // coverage,
    glossCount: Infinity,
    bottom: new Tone('b', -1),
  };

  readonly expert = {
    coverage: [
      ...note.map((v) => new Tone(v, 0)),
      ...note.map((v) => new Tone(v, 1)),
    ].slice(0, 13),
    // coverage,
    glossCount: Infinity,
    bottom: new Tone('b', -1),
  };

  constructor(readonly cd: ChangeDetectorRef, readonly midi: MidiMediator) {}

  ngOnInit(): void {
    this.synth = new Synth();
  }

  onClickStart(options: SeriesOptions): void {
    this.activeTone = null;
    this.series = new Series();

    this.series.destroy$.subscribe(() => {
      this.wrong();
      this.midi.updateInput(null);
      this.cd.detectChanges(); // for MIDI
    });

    this.series.trigger$
      .pipe(takeUntil(this.series.destroy$))
      .subscribe((v) => this.play(v.tone, v.duration, v.prefersGloss));

    this.midi.noteNumber$
      .pipe(takeUntil(this.series.destroy$))
      .subscribe((v) => this.triggerTone(allTones[v - 48]));

    console.log(new UAParser().getOS());

    this.series.startSeries(options);
  }

  getKeyLabel(position: 'upper' | 'lower', i: number): string {
    const os = new UAParser().getOS().name ?? '';
    const isMobile = os.includes('iOS') || os.includes('Android');
    if (isMobile) {
      return '';
    }

    switch (position) {
      case 'upper':
        return 'wertyuio'[i];
      case 'lower':
        return 'asdfghjkl'[i];
      default:
        throw new Error('Invalid position');
    }
  }

  getCount(): number {
    return this.series?.getCount() ?? 0;
  }

  getScore(): number {
    return Math.max(0, this.getCount() - 1);
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
    return a.eq(b);
  }

  trackBy(tone: Tone): string {
    return tone.toString();
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

  private async play(
    tone: Tone,
    duration: number,
    prefersGloss: boolean
  ): Promise<void> {
    this.isPlaying = true;
    if (prefersGloss) {
      this.activeTone = tone;
    }
    this.cd.detectChanges(); // for MIDI
    await this.synth?.play(
      freqArr[note.indexOf(tone.note) + tone.oct * 12],
      duration
    );

    requestAnimationFrame(() => {
      this.isPlaying = false;
      this.activeTone = null;
      this.cd.detectChanges(); // for MIDI
    });
  }

  private async wrong(): Promise<void> {
    await this.synth?.play(103.82, 100);
    await this.synth?.play(103.82, 600);
  }
}
