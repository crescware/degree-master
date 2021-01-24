import { Subject } from 'rxjs';
import { Tone } from './tone';

export class Series {
  readonly trigger$ = new Subject<{ tone: Tone; duration: number }>();
  readonly destroy$ = new Subject<void>();
  tones: Tone[] = [];
  cursor = 0;
  private coverage: Tone[] = [];

  startSeries(coverage: Tone[]): void {
    this.coverage = coverage;
    this.addToSeries(this.getNext());
    setTimeout(() => this.playSeries(), 500);
  }

  async guess(tone: Tone): Promise<void> {
    await this.trigger(tone, 500);

    const current = this.tones[this.cursor];
    if (current[0] === tone[0] && current[1] === tone[1]) {
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
    return this.coverage[Math.floor(Math.random() * this.coverage.length)];
  }

  private addToSeries(tone: Tone): void {
    this.tones = this.tones.concat([tone]);
  }

  private async playSeries(): Promise<void> {
    await this.tones.reduce(async (prev, tone) => {
      await prev;
      await this.trigger(tone, 500);
    }, Promise.resolve());
  }

  private async trigger(tone: Tone, duration: number): Promise<void> {
    this.trigger$.next({ tone, duration });
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
