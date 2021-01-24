import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import MIDIInput = WebMidi.MIDIInput;
import MIDIMessageEvent = WebMidi.MIDIMessageEvent;

@Injectable({ providedIn: 'root' })
export class MidiMediator {
  noteNumber$ = new Subject<number>();
  private inputs: MIDIInput[] = [];
  private input: MIDIInput | null = null;
  private midiMessage$ = new Subject<MIDIMessageEvent>();

  constructor() {
    this.init();

    this.midiMessage$
      .pipe(
        map((v) => {
          return [...v.data].map((v) => v.toString(16));
        }),
        filter(([m]) => m === '90'), // note on
        map(([, d1]) => parseInt(d1, 16)) // note number
      )
      .subscribe((v) => this.noteNumber$.next(v));
  }

  isEnabled(): boolean {
    return this.isMidiSupported() && this.input !== null;
  }

  isMidiSupported(): boolean {
    return typeof navigator.requestMIDIAccess === 'function';
  }

  async init(): Promise<void> {
    if (!this.isMidiSupported()) {
      return;
    }
    const midi = await navigator.requestMIDIAccess();
    this.inputs = [...midi.inputs.values()];
  }

  getInputLabels(): string[] {
    return this.inputs.map((v) => v.name ?? '(unknown)');
  }

  updateInput(i: number | null) {
    if (i === null) {
      this.input = null;
      return;
    }
    this.input = this.inputs[i];
    this.input.onmidimessage = (e: MIDIMessageEvent) => {
      this.midiMessage$.next(e);
    };
  }
}
