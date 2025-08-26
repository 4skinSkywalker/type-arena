import { Component, computed, effect, input, Input } from '@angular/core';
import { LaneComponent } from './lane/lane.component';

@Component({
  selector: 'app-arena',
  imports: [LaneComponent],
  templateUrl: './arena.component.html',
  styleUrl: './arena.component.scss'
})
export class ArenaComponent {
  started = input(true, {alias: "started"});
  quote = input("", {alias: "quote"});
  chars: { index: number, char: string, active: boolean, digited: boolean, error: boolean }[] = [];
  activeIndex = 0;
  finished = false;
  percentage = 0;
  wpm = 0;
  mistakes = 0;
  accuracy = 0;
  dirty = false;
  startTime = 0;
  avgWordLength = computed<number>(() => {
    const words = this.quote().split(" ");
    return words.reduce((acc, word) => acc + word.length, 0) / words.length;
  })

  _textControl!: HTMLInputElement;
  get textControl() {
    if (!this._textControl) {
      this._textControl = document.querySelector("#text-control")!;
    }
    return this._textControl;
  }

  constructor() {}

  ngOnInit() {
    this.setChars(this.quote());
    effect(() => {
      this.setChars(this.quote());
    });
  }

  ngAfterViewInit() {
    this.keepCursorAtTheEnd();
  }

  setChars(quote: string) {
    this.chars = quote
      .split("")
      .map((char, index) => ({
        index,
        char,
        active: index === 0,
        digited: false,
        error: false
      }));
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
    if (!this.started()) {
      this.textControl.value = "";
      this.textControl.blur();
      this.wpm = 0;
      this.mistakes = 0;
      this.accuracy = 0;
      this.dirty = false;
      this.startTime = 0;
      return;
    }

    if (!this.dirty) {
      this.startTime = Date.now();
    }

    this.dirty = true;

    const userText = event.target.value;

    this.finished = false;
    this.chars.forEach(char => {
      char.active = false;
      char.digited = false;
      char.error = false;
    });

    let i = 0;
    let hasError = false;
    for (; i < Math.min(userText.length, this.chars.length); i++) {
      const char = userText[i];
      const qchar = this.chars[i];
      qchar.digited = true;
      if (char !== qchar.char) {
        hasError = true;
        this.mistakes++;
      }
      qchar.error = hasError;
    }

    const correctChars = this.chars.filter(char => char.digited && !char.error).length;
    this.percentage = correctChars / this.chars.length;

    if (userText.length >= this.chars.length) {
      this.finished = this.chars.every(char => char.digited && !char.error);
      return;
    }

    const deltaTime = Date.now() - this.startTime;
    this.wpm = Math.round((correctChars * 60) / (this.avgWordLength() * (deltaTime / 1000)));
    this.accuracy = Math.round(correctChars / (userText.length + this.mistakes) * 100);

    if (this.chars[i]) {
      this.chars[i].active = true;
      this.activeIndex = i;
    }
  }
}
