import { ChangeDetectorRef, Component } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import * as UAParser from 'ua-parser-js';

import { advanced, basic, expert } from './difficulty';
import { MidiMediator } from './midi-mediator';
import { Series, SeriesOptions } from './series';
import { Synth } from './synth';
import { allTones, note, Tone } from './tone';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [Synth],
})
export class AppComponent {
  readonly destroy$ = new Subject<void>();
  readonly basic = basic;
  readonly advanced = advanced;
  readonly expert = expert;
  series: Series | null = null;
  activeTone: Tone | null = null;
  isPlaying = false;

  constructor(
    readonly cd: ChangeDetectorRef,
    readonly synth: Synth,
    readonly midi: MidiMediator
  ) {}

  onClickStart(options: SeriesOptions): void {
    this.resetAll();
    this.series = new Series();

    this.series.destroy$.subscribe(() => {
      this.wrong();
      this.resetAll();
      this.cd.detectChanges(); // for MIDI
    });

    this.series.trigger$
      .pipe(takeUntil(this.series.destroy$))
      .subscribe((v) => this.play(v.tone, v.duration, v.prefersGloss));

    this.midi.noteNumber$
      .pipe(takeUntil(this.series.destroy$))
      .subscribe((v) => this.triggerTone(allTones[v - 48]));

    this.prepareKeyboardBinding();
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

  private resetAll() {
    this.activeTone = null;
    this.series = null;
    this.midi.updateInput(null);
    this.destroy$.next();
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
    await this.synth?.play(tone.getFreq(), duration);

    requestAnimationFrame(() => {
      this.isPlaying = false;
      this.activeTone = null;
      this.cd.detectChanges(); // for MIDI
    });
  }

  private async wrong(): Promise<void> {
    await this.synth?.play(new Tone('f#', -1).getFreq(), 100);
    await this.synth?.play(new Tone('f#', -1).getFreq(), 600);
  }

  private prepareKeyboardBinding() {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        map((v) => v.key),
        takeUntil(this.destroy$)
      )
      .subscribe((v) => {
        if ('wertyuio'.includes(v)) {
          const tone = this.series?.getUpperKeys()[
            [...'wertyuio'].findIndex((char) => char === v)
          ];
          this.triggerTone(tone ?? null);
          return;
        }
        const tone = this.series?.getLowerKeys()[
          [...'asdfghjkl'].findIndex((char) => char === v)
        ];
        this.triggerTone(tone ?? null);
      });
  }
}
