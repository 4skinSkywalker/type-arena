import { Component, Input } from '@angular/core';
import { LaneComponent } from './lane/lane.component';

@Component({
  selector: 'app-arena',
  imports: [LaneComponent],
  templateUrl: './arena.component.html',
  styleUrl: './arena.component.scss'
})
export class ArenaComponent {
  @Input("started") started = false;
  @Input("quote") quote = "Don't practice too much at first";
  chars: ({ index: number, char: string, active: boolean, digited: boolean, error: boolean })[] = [];
  activeIndex = 0;
  finished = false;
  percentage = 0;

  _textControl!: HTMLInputElement;
  get textControl() {
    if (!this._textControl) {
      this._textControl = document.querySelector("#text-control")!;
    }
    return this._textControl;
  }

  constructor() {}

  ngOnInit() {
    this.chars = this.quote.
      split("").
      map((char, index) => ({
        index,
        char,
        active: index === 0,
        digited: false,
        error: false
      }));
  }

  inputText(event: any) {
    if (!this.started) {
      this.textControl.value = "";
      this.textControl.blur();
      return;
    }

    const text = event.target.value;

    this.finished = false;
    this.chars.forEach(char => {
      char.active = false;
      char.digited = false;
      char.error = false;
    });

    let i = 0;
    let hasError = false;
    for (; i < Math.min(text.length, this.chars.length); i++) {
      const char = text[i];
      const qchar = this.chars[i];
      qchar.digited = true;
      if (char !== qchar.char) {
        hasError = true;
      }
      qchar.error = hasError;
    }

    this.percentage = this.chars.filter(char => char.digited && !char.error).length / this.chars.length;

    if (text.length >= this.chars.length) {
      this.finished = this.chars.every(char => char.digited && !char.error);
      return;
    }

    if (this.chars[i]) {
      this.chars[i].active = true;
      this.activeIndex = i;
    }
  }
}
