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
  @Input("quote") quote = `So, I'm tending bar there at Ecklund & Swedlin's last Tuesday and this little guy's drinking and he says, "So where can a guy find some action - I'm goin' crazy down there at the lake." And I says, "What kinda action?" and he says, "Woman action, what do I look like?" And I says, "Well, what do I look like? I don't arrange that kinda thing."`;
  chars: ({ index: number, char: string, active: boolean, digited: boolean, error: boolean })[] = [];
  activeIndex = 0;
  finished = false;
  percentage = 0;
  wpm = 0;
  dirty = false;
  startTime = 0;
  avgWordLength = 0;

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
    
    const words = this.quote.split(" ");
    this.avgWordLength = words.reduce((acc, word) => acc + word.length, 0) / words.length;
  }

  ngAfterViewInit() {
    this.keepCursorAtTheEnd();
  }

  keepCursorAtTheEnd() {
    const moveCaretToEnd = (el: HTMLInputElement) => {
      const length = el.value.length;
      el.setSelectionRange(length, length);
    };

    this.textControl.addEventListener("click", () => moveCaretToEnd(this.textControl));
    this.textControl.addEventListener("focus", () => moveCaretToEnd(this.textControl));
    this.textControl.addEventListener("input", () => moveCaretToEnd(this.textControl));
    this.textControl.addEventListener("keydown", () => {
      setTimeout(() => moveCaretToEnd(this.textControl), 0);
    });
  }

  inputText(event: any) {
    if (!this.started) {
      this.textControl.value = "";
      this.textControl.blur();
      this.dirty = false;
      this.startTime = 0;
      return;
    }

    if (!this.dirty) {
      this.startTime = Date.now();
    }

    this.dirty = true;

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

    const correctChars = this.chars.filter(char => char.digited && !char.error).length;
    this.percentage = correctChars / this.chars.length;

    if (text.length >= this.chars.length) {
      this.finished = this.chars.every(char => char.digited && !char.error);
      return;
    }

    const deltaTime = Date.now() - this.startTime;
    this.wpm = Math.round((correctChars * 60) / (this.avgWordLength * (deltaTime / 1000)));

    if (this.chars[i]) {
      this.chars[i].active = true;
      this.activeIndex = i;
    }
  }
}
