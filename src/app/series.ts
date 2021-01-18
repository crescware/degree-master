import { Subject } from 'rxjs';

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

export class Series {
  readonly playTone$ = new Subject<{ tone: Tone; duration: number }>();
  readonly destroy$ = new Subject<void>();
  tones: Tone[] = [];
  cursor = 0;

  startSeries() {
    this.addToSeries(this.getNext());
    setTimeout(() => this.playSeries(), 500);
  }

  async guess(n: Note, oct: Oct) {
    await this.play([n, oct], 500);

    const current = this.tones[this.cursor];
    if (current[0] === n && current[1] === oct) {
      console.log('OK');
      this.cursor += 1;
      if (this.cursor === this.getCount()) {
        this.cursor = 0;
        this.addToSeries(this.getNext());
        setTimeout(() => this.playSeries(), 500);
      }
      return;
    }

    console.log('NG');
    await this.sleep(400);
    this.destroy();
  }

  getCount(): number {
    return this.tones.length;
  }

  private getNext(): Tone {
    const choices = note.map((v) => [v, 0] as Tone).concat([['c', 1]]);
    return choices[Math.floor(Math.random() * choices.length)];
  }

  private addToSeries(tone: Tone): void {
    this.tones = this.tones.concat([tone]);
  }

  private async playSeries(): Promise<void> {
    await this.tones.reduce(async (prev, tone, i) => {
      await prev;
      await this.play(tone, 500);
    }, Promise.resolve());
  }

  private async play(tone: Tone, duration: number): Promise<void> {
    const gap = 10; // 前のオシレーターインスタンス破棄時間を設けるため
    this.playTone$.next({ tone, duration: duration - gap });
    await this.sleep(duration + gap);
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
