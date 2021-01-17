import { Component, OnInit } from '@angular/core';

import { Synth } from './synth';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  synth: Synth | null = null;

  ngOnInit() {
    this.synth = new Synth();
  }

  onMousedown() {
    this.synth?.play(440, 300);
  }
}
