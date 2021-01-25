import { Subject } from 'rxjs';
import { allTones, Tone } from './tone';

export interface SeriesOptions {
  id: string;
  coverage: Tone[];
  glossCount: number;
  bpm: number;
}

export interface Buttons {
  upper: Array<Tone | null>;
  lower: Array<Tone | null>;
}

function buildButtons(options: SeriesOptions): Buttons {
  const bottom = (() => {
    const prev1 = options.coverage[0].prevTone();
    if (prev1.isUpperKey()) {
      return prev1.prevTone();
    }
    return prev1;
  })();
  const i = allTones.findIndex((v) => v.eq(bottom));
  const range = allTones.slice(i, i + 15);
  return range.reduce(
    (acc, tone) => {
      if (acc.upper.length === 8 && acc.lower.length === 9) {
        return acc;
      }
      const isEnabled = options.coverage.find((cover) => cover.eq(tone));
      if (tone.isSameNote('e') || tone.isSameNote('b')) {
        acc.lower = acc.lower.concat(isEnabled ? tone : null);
        if (acc.upper.length !== 8) {
          acc.upper = acc.upper.concat(null);
        }
        return acc;
      }
      if (tone.isUpperKey()) {
        acc.upper = acc.upper.concat(isEnabled ? tone : null);
        return acc;
      }
      acc.lower = acc.lower.concat(isEnabled ? tone : null);
      return acc;
    },
    { upper: [], lower: [] } as Buttons
  );
}

export class Series {
  readonly trigger$ = new Subject<{
    tone: Tone;
    duration: number;
    prefersGloss: boolean;
  }>();
  readonly destroy$ = new Subject<number>();
  private tones: Tone[] = [];
  private buttons: Buttons = { upper: [], lower: [] };
  private cursor = 0;
  private score = 0;
  private options: SeriesOptions | null = null;
  private duration = 500;

  startSeries(options: SeriesOptions): void {
    this.options = options;
    this.buttons = buildButtons(options);
    this.duration = 60000 / options.bpm;
    this.addToSeries(this.getNext());
    setTimeout(() => this.playSeries(), this.duration);
  }

  async guess(tone: Tone): Promise<void> {
    await this.trigger(tone, this.duration, true);

    const current = this.tones[this.cursor];
    if (!current) {
      return;
    }
    if (current.eq(tone)) {
      this.cursor += 1;
      if (this.cursor === this.getCount()) {
        this.cursor = 0;
        this.addToSeries(this.getNext());
        this.score += this.calcEarnedScore();
        setTimeout(() => this.playSeries(), this.duration);
      }
      return;
    }

    await this.sleep(400);
    this.destroy();
  }

  getCount(): number {
    return this.tones.length;
  }

  getScore(): number {
    return this.score;
  }

  getId(): string {
    if (this.options === null) {
      throw new Error('Failed to instantiate Series');
    }
    return this.options.id;
  }

  getUpperKeys(): Array<Tone | null> {
    if (this.options === null) {
      return [];
    }
    return this.buttons.upper;
  }

  getLowerKeys(): Array<Tone | null> {
    if (this.options === null) {
      return [];
    }
    return this.buttons.lower;
  }

  calcEarnedScore(): number {
    const options = this.options;
    if (options === null) {
      throw new Error('Failed to instantiate Series');
    }
    if (options.id !== 'master') {
      return 1;
    }
    const oniRatio = options.glossCount === 1 ? 2 : 1;
    return Math.floor(
      (options.coverage.length * oniRatio * (options.bpm - 30)) / 100
    );
  }

  private getNext(): Tone {
    if (this.options === null) {
      throw new Error('Failed to instantiate Series');
    }
    return this.options.coverage[
      Math.floor(Math.random() * this.options.coverage.length)
    ];
  }

  private addToSeries(tone: Tone): void {
    this.tones = this.tones.concat([tone]);
  }

  private async playSeries(): Promise<void> {
    await this.tones.reduce(async (prev, tone) => {
      await prev;
      if (this.options === null) {
        throw new Error('Failed to instantiate Series');
      }
      const prefersGloss = this.getCount() <= this.options.glossCount;
      await this.trigger(tone, this.duration, prefersGloss);
    }, Promise.resolve());
  }

  private async trigger(
    tone: Tone,
    duration: number,
    prefersGloss: boolean
  ): Promise<void> {
    if (this.options === null) {
      throw new Error('Failed to instantiate Series');
    }
    this.trigger$.next({ tone, duration, prefersGloss });
    await this.sleep(duration + 10); // 次の発音に移る前に描画を終わらせるために少し余裕を持つ
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private destroy(): void {
    this.tones = [];
    this.cursor = 0;
    this.destroy$.next();
  }
}
