export class Synth {
  playCount = 0;
  ctx: AudioContext | null = null;
  gainEnvelope: GainNode | null = null;
  osc: OscillatorNode | null = null;

  constructor() {
    this.init();
  }

  async play(hz: number, durationMs: number): Promise<void> {
    if (0 < this.playCount) {
      await this.stopImmediately();
      await this.sleep(10);
      this.createNewOscillator();
    }
    const [ctx, gainEnvelope, osc] = this.getInstances();

    osc.frequency.value = hz;

    const t1 = ctx.currentTime;
    gainEnvelope.gain.cancelScheduledValues(t1);
    gainEnvelope.gain.setValueAtTime(0, t1);
    gainEnvelope.gain.linearRampToValueAtTime(1, t1 + 0.001);

    this.playCount += 1;
    osc.start();

    const releaseMs = Math.max(1, Math.min(200, durationMs));
    await this.sleep(durationMs - releaseMs);

    const t2 = ctx.currentTime;
    gainEnvelope.gain.setValueAtTime(gainEnvelope.gain.value, t2);
    gainEnvelope.gain.linearRampToValueAtTime(0, t2 + releaseMs / 1000);

    await this.sleep(releaseMs);

    this.playCount -= 1;
    if (0 < this.playCount) {
      return;
    }
    osc.stop();
    osc.disconnect();
    this.createNewOscillator();
  }

  private init() {
    this.ctx = new AudioContext();
    this.gainEnvelope = this.ctx.createGain();
    this.createNewOscillator();
    this.gainEnvelope.connect(this.ctx.destination);
  }

  private async stopImmediately(): Promise<void> {
    const [ctx, gainEnvelope, osc] = this.getInstances();
    const t = ctx.currentTime;
    const ms = 100;

    gainEnvelope.gain.setValueAtTime(gainEnvelope.gain.value, t);
    gainEnvelope.gain.linearRampToValueAtTime(0, t + ms / 1000);

    await this.sleep(ms);
    osc.stop();
  }

  private getInstances(): [AudioContext, GainNode, OscillatorNode] {
    if (this.ctx === null || this.gainEnvelope === null || this.osc === null) {
      throw new Error('Invalid instantiation');
    }
    return [this.ctx, this.gainEnvelope, this.osc];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private createNewOscillator(): void {
    if (this.ctx === null || this.gainEnvelope === null) {
      throw new Error('');
    }
    this.osc = this.ctx.createOscillator();
    this.osc.type = 'sine';
    this.osc.connect(this.gainEnvelope);
  }
}
