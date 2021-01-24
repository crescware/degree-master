import { Injectable } from '@angular/core';

interface Window {
  webkitAudioContext: typeof AudioContext;
}

const oscillatorNotFoundError = 'Oscillator not found';

function makeHash(): string {
  const n = 16;
  return btoa(
    String.fromCharCode(...crypto.getRandomValues(new Uint8Array(n)))
  ).substring(0, n);
}

@Injectable()
export class Synth {
  playCount = 0;
  ctx: AudioContext | null = null;
  oscGroup: Array<{
    hash: string;
    osc: OscillatorNode;
    gainEnvelope: GainNode;
  }> = [];

  constructor() {
    this.init();
  }

  async play(hz: number, durationMs: number): Promise<void> {
    await this.playImpl(hz, durationMs, makeHash());
  }

  private init() {
    this.ctx = (() => {
      if ('webkitAudioContext' in window) {
        return new ((window as unknown) as Window).webkitAudioContext();
      }
      return new AudioContext();
    })();
  }

  private getAudioContext(): AudioContext {
    if (this.ctx === null) {
      throw new Error('Invalid instantiation');
    }
    return this.ctx;
  }

  private getOscillator(hash_: string): OscillatorNode {
    const found = this.oscGroup.find(({ hash }) => hash === hash_);
    if (!found) {
      throw new Error(oscillatorNotFoundError);
    }
    return found.osc;
  }

  private getGainEnvelope(hash_: string): GainNode {
    const found = this.oscGroup.find(({ hash }) => hash === hash_);
    if (!found) {
      throw new Error(oscillatorNotFoundError);
    }
    return found.gainEnvelope;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private createNewOscillator(hash_: string): void {
    if (this.ctx === null) {
      throw new Error('Invalid instantiation');
    }
    const i = this.oscGroup.findIndex(({ hash }) => hash === hash_);
    const osc = this.ctx.createOscillator();
    const gainEnvelope = this.ctx.createGain();
    gainEnvelope.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.connect(gainEnvelope);
    if (i < 0) {
      this.oscGroup = this.oscGroup.concat([
        { hash: hash_, osc, gainEnvelope },
      ]);
      return;
    }
    this.oscGroup[i].osc = osc;
  }

  private async playImpl(
    hz: number,
    durationMs: number,
    hash: string
  ): Promise<void> {
    if (0 < this.playCount) {
      this.stopOthers(hash);
      await this.sleep(1); // 別スタックにするため
    }

    const ctx = this.getAudioContext();
    let osc: OscillatorNode;
    try {
      osc = this.getOscillator(hash);
    } catch (e) {
      if (!e.message.includes(oscillatorNotFoundError)) {
        throw e;
      }
      this.createNewOscillator(hash);
      osc = this.getOscillator(hash);
    }
    osc.frequency.value = hz;

    const t1 = ctx.currentTime;
    const gainEnvelope = this.getGainEnvelope(hash);
    gainEnvelope.gain.cancelScheduledValues(t1);
    gainEnvelope.gain.setValueAtTime(0, t1);
    // vol 1だとクリップする
    gainEnvelope.gain.linearRampToValueAtTime(0.7, t1 + 0.001);

    this.playCount += 1;
    osc.start();

    const releaseMs = Math.max(1, Math.min(200, durationMs));
    await this.sleep(durationMs - releaseMs);
    await this.release(hash, releaseMs);

    this.playCount -= 1;
    this.destroyOscillator(hash);
  }

  private async release(hash: string, releaseMs: number): Promise<void> {
    const ctx = this.getAudioContext();

    const gainEnvelope = this.getGainEnvelope(hash);
    const t2 = ctx.currentTime;
    gainEnvelope.gain.setValueAtTime(gainEnvelope.gain.value, t2);
    gainEnvelope.gain.linearRampToValueAtTime(0, t2 + releaseMs / 1000);
    await this.sleep(releaseMs);
  }

  private stopOthers(hash_: string): void {
    this.oscGroup
      .filter(({ hash }) => hash !== hash_)
      .reduce(async (prev, { hash }) => {
        await this.release(hash, 100);
        this.destroyOscillator(hash);
      }, Promise.resolve());
  }

  private destroyOscillator(hash_: string): void {
    let osc: OscillatorNode;
    try {
      osc = this.getOscillator(hash_);
    } catch (e) {
      if (!e.message.includes(oscillatorNotFoundError)) {
        throw e;
      }
      return;
    }
    osc.stop();
    osc.disconnect();
    this.oscGroup = this.oscGroup.filter(({ hash }) => hash !== hash_);
  }
}
