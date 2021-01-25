import { ChangeDetectorRef, Component } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import * as UAParser from 'ua-parser-js';

import {
  advanced,
  basic,
  expert,
  masterA,
  masterAs,
  masterB,
  masterC,
  masterCs,
  masterD,
  masterDs,
  masterE,
  masterF,
  masterFs,
  masterG,
  masterGs,
  oniAdvanced,
  oniBasic,
  oniExpert,
} from './difficulty';
import { MidiMediator } from './midi-mediator';
import { Series, SeriesOptions } from './series';
import { Synth } from './synth';
import { allTones, Note, Tone } from './tone';

interface HighScore {
  basic: number;
  advanced: number;
  expert: number;
  oniBasic: number;
  oniAdvanced: number;
  oniExpert: number;
  master: number;
  isUnlocked: boolean;
}

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
  readonly oniBasic = oniBasic;
  readonly oniAdvanced = oniAdvanced;
  readonly oniExpert = oniExpert;
  readonly oniThreshold = 3;
  readonly gameModeIcon = ['👼', '👹', '🏆'] as const;
  series: Series | null = null;
  activeTone: Tone | null = null;
  isPlaying = false;
  isEnding = false;
  isMasterConfig = false;
  isUnlockedOni = false;
  isUnlockedMaster = false;
  masterKey: Note = 'f';
  useOniMaster = false;
  masterBpm: number = 130;
  highScore: HighScore = {
    basic: this.oniThreshold,
    advanced: this.oniThreshold,
    expert: this.oniThreshold,
    oniBasic: 0,
    oniAdvanced: 0,
    oniExpert: 0,
    master: 0,
    isUnlocked: false,
  }; // default high score
  gameMode: 0 | 1 | 2 = 0; // 0 = normal, 1 = oni, 2 = master

  constructor(
    readonly cd: ChangeDetectorRef,
    readonly synth: Synth,
    readonly midi: MidiMediator
  ) {}

  ngOnInit() {
    this.loadHighScore();
  }

  onClickStart(options: SeriesOptions): void {
    this.resetAll();
    this.series = new Series();
    this.loadHighScore();

    this.series.destroy$.subscribe(() => {
      this.wrong();
      this.transitionToEnding();
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

  onClickTransitionToMaster() {
    this.isMasterConfig = true;
  }

  onClickRetry() {
    this.isEnding = false;
    this.resetAll();
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

  getCurrentScore(): number {
    return this.series?.getScore() ?? 0;
  }

  getCurrentHighScore(): number {
    return Math.max(this.series?.getScore() ?? 0, this.getOriginalHighScore());
  }

  isUpdatingHighScore(): boolean {
    return this.getOriginalHighScore() < (this.series?.getScore() ?? 0);
  }

  onClickNextMode(): void {
    if (this.gameMode === 0 && this.isUnlockedOni) {
      this.gameMode = 1;
      return;
    }
    if (this.gameMode === 1 && !this.isUnlockedMaster) {
      this.gameMode = 0;
      return;
    }
    if (this.gameMode === 1 && this.isUnlockedMaster) {
      this.gameMode = 2;
      return;
    }
    if (this.gameMode === 2) {
      this.gameMode = 0;
      return;
    }
    // noop
  }

  getNextIcon(): string {
    if (this.gameMode === 0 && this.isUnlockedOni) {
      return this.gameModeIcon[1];
    }
    if (this.gameMode === 1 && !this.isUnlockedMaster) {
      return this.gameModeIcon[0];
    }
    if (this.gameMode === 1 && this.isUnlockedMaster) {
      return this.gameModeIcon[2];
    }
    if (this.gameMode === 2) {
      return this.gameModeIcon[0];
    }
    return '　';
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

  onChangeMasterKey(ev: Event): void {
    const { target } = ev;
    if (target === null) {
      throw new Error('target should be found');
    }
    const optionEl = target as HTMLOptionElement;
    this.masterKey = optionEl.value as Note;
  }

  onChangeSpeed(ev: Event): void {
    const { target } = ev;
    if (target === null) {
      throw new Error('target should be found');
    }
    const optionEl = target as HTMLOptionElement;
    this.masterBpm = parseInt(optionEl.value) as number;
  }

  onChangeOni(ev: Event): void {
    const { target } = ev;
    if (target === null) {
      throw new Error('target should be found');
    }
    const inputEl = target as HTMLInputElement;
    this.useOniMaster = inputEl.checked;
  }

  onClickStartMaster() {
    this.isMasterConfig = false;
    this.onClickStart(
      (() => {
        const options = {
          bpm: this.masterBpm,
          glossCount: this.useOniMaster ? 1 : Infinity,
        };

        if (this.masterKey === 'f') {
          return { ...masterF, ...options };
        }
        if (this.masterKey === 'f#') {
          return { ...masterFs, ...options };
        }
        if (this.masterKey === 'g') {
          return { ...masterG, ...options };
        }
        if (this.masterKey === 'g#') {
          return { ...masterGs, ...options };
        }
        if (this.masterKey === 'a') {
          return { ...masterA, ...options };
        }
        if (this.masterKey === 'a#') {
          return { ...masterAs, ...options };
        }
        if (this.masterKey === 'b') {
          return { ...masterB, ...options };
        }
        if (this.masterKey === 'c') {
          return { ...masterC, ...options };
        }
        if (this.masterKey === 'c#') {
          return { ...masterCs, ...options };
        }
        if (this.masterKey === 'd') {
          return { ...masterD, ...options };
        }
        if (this.masterKey === 'd#') {
          return { ...masterDs, ...options };
        }
        if (this.masterKey === 'e') {
          return { ...masterE, ...options };
        }
        throw new Error('Invalid master key');
      })()
    );
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
    this.activeTone = prefersGloss ? tone : this.activeTone;
    this.cd.detectChanges(); // for MIDI
    await this.synth?.play(tone.getFreq(), duration);

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

  private getOriginalHighScore(): number {
    return Number((this.highScore as any)[this.series?.getId() ?? ''] as any);
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

  private loadHighScore(): void {
    const jsonStr =
      localStorage.getItem('json') ?? JSON.stringify(this.highScore);
    this.highScore = JSON.parse(jsonStr);
    console.log(this.highScore);
    if (
      [
        this.oniThreshold < this.highScore.basic,
        this.oniThreshold < this.highScore.advanced,
        this.oniThreshold < this.highScore.expert,
      ].some((v) => v)
    ) {
      this.isUnlockedOni = true;
    }
    if (this.highScore.isUnlocked) {
      this.isUnlockedMaster = true;
    }
  }

  private transitionToEnding() {
    this.isEnding = true;
    const id = this.series?.getId() ?? '';
    if (id === '') {
      throw new Error('Unknown series');
    }
    const newHighScore = {
      ...this.highScore,
      [id]: this.getCurrentHighScore(),
    };
    localStorage.setItem('json', JSON.stringify(newHighScore));
    requestAnimationFrame(() => {
      this.loadHighScore();
    });
  }
}
