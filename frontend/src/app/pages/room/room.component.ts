import { Component, computed, effect, HostListener, Signal, signal, ViewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ApiService, Handlers } from '../../services/api.service';
import { check, delay, uncheck, copyToClipboard, focus, scrollToBottom, throttle, scrollToTop, debounce } from '../../shared/utils';
import { IChatReceivedMessage, IClientJSON, IClientWithPercentage, IClientWithRoomMessage, IIsTypingChatReceived, IProgressReceivedMessage, IRoomDetailsReceivedMessage, IRoomJSON } from '../../../../../backend/src/models';
import { BasicModule } from '../../basic.module';
import { FormControl } from '@angular/forms';
import { LoaderService } from '../../components/loader/loader-service.service';
import { DEATH_MODE_COLOR, getDefaultWinners, getSystemClient, NORMAL_MODE_COLOR } from './room.util';
import { ArenaComponent, IArenaProgress } from '../../components/arena/arena.component';
import { ellipsis } from '../../pipes/ellipsis.pipe';

@Component({
  selector: 'app-room',
  imports: [BasicModule, ArenaComponent],
  providers: [],
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss'
})
export class RoomComponent {
  @ViewChild(ArenaComponent) arenaComponent!: ArenaComponent;

  JSON = JSON;
  check = check;
  uncheck = uncheck;
  roomId;
  chatMessages = signal<IChatReceivedMessage[]>([]);
  chatMessage = new FormControl("", { nonNullable: true });
  initializedRoom = signal(false);
  room = signal<IRoomJSON | null | undefined>(null);
  deathMode = computed(() => {
    const isDeathMode = this.room()?.deathMode || false;
    this.setDeathModeColor(isDeathMode);
    return isDeathMode;
  });
  quote = computed(() => this.room()?.race.quote.quote || "");
  author = computed(() => this.room()?.race.quote.author || "");
  winners = computed(() => this.room()?.race.winners || getDefaultWinners());
  client: Signal<IClientJSON | null | undefined>;
  isHost: Signal<boolean>;
  countdown = signal(0);
  countdownRunning = signal(false);
  countdownExpired = signal(false);
  gold = signal("");
  silver = signal("");
  bronze = signal("");
  raceStarted = signal(false);
  racePlayersSortByPercentage = computed<IClientWithPercentage[]>(() => 
    Object.values(this.room()?.race.players || {})
      .sort((a, b) => b.percentage - a.percentage)
  );
  me = computed<IClientWithPercentage | null>(() => 
    this.room()?.race.players[this.client()?.id || ""] || null
  );
  others = computed<IClientWithPercentage[]>(() =>
    this.racePlayersSortByPercentage()
      .filter(client => client.id !== this.client()?.id)
      .sort((a, b) => a.id > b.id ? 1 : -1)
  );

  get isTypingInfoElement() {
    return document.querySelector(".is-typing-info") as HTMLDivElement;
  }

  handlers: Handlers = {
    "chatReceived": this.handleChatReceived.bind(this),
    "roomDetailsReceived": this.handleRoomDetailsReceived.bind(this),
    "clientJoined": this.handleClientJoined.bind(this),
    "clientLeft": this.handleClientLeft.bind(this),
    "gameStarted": this.handleGameStarted.bind(this),
    "gameResetted": this.handleGameResetted.bind(this),
    "progressReceived": this.handleProgressReceived.bind(this),
    "isTypingChatReceived": this.handleIsTypingChatReceived.bind(this),
  };

  @HostListener("document:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.shiftKey && event.key === "Enter") {
      event.preventDefault();
      if (!this.raceStarted()) {
        this.startGame();
      }
    }

    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      this.newGame();
    }
  }

  constructor(
    public api: ApiService,
    private route: ActivatedRoute,
    private loaderService: LoaderService,
  ) {
    this.roomId = this.route.snapshot.paramMap.get("id")!;
    this.client = toSignal(this.api.client$);
    this.isHost = computed(() => {
      const room = this.room();
      const client = this.client();
      return !!room && !!room.host && !!client && room.host.id === client.id;
    });

    effect(() => {
      const w = window as any;
      w.room = this.room();
      w.isHost = this.isHost();
      w.raceStarted = this.raceStarted();
      w.deathMode = this.deathMode();
      w.me = this.me();
    });
  }

  ngOnInit() {
    (window as any).game = this;
    this.api.subscribe(this.handlers);
    this.loaderService.isLoading.set(true);
  }

  async ngAfterViewInit() {
    await delay(0.2);
    this.api.send("joinRoom", { roomId: this.roomId });
    this.api.send("roomDetails", { roomId: this.roomId });
  }

  ngOnDestroy() {
    this.api.unsubscribe(this.handlers);
    this.loaderService.isLoading.set(false);
    this.api.send("leaveRoom", { roomId: this.roomId });
    this.setDeathModeColor(false);
  }

  handleIsTypingChat = throttle(() => {
    this.api.send("isTypingChat", { roomId: this.roomId });
  }, 500);

  removeTypingInfo = debounce(() => {
    this.isTypingInfoElement.innerHTML = "";
  }, 750);

  handleIsTypingChatReceived(msg: IIsTypingChatReceived) {
    if (msg.client.id === this.client()?.id) {
      return;
    }

    this.isTypingInfoElement.innerHTML = `${ellipsis(msg.client.name, 15)} is typing...`;
    this.removeTypingInfo();
  }

  setDeathModeColor(isDeathMode: boolean) {
    const color = isDeathMode ? DEATH_MODE_COLOR : NORMAL_MODE_COLOR;
    document.body.style.setProperty("--primary-color", color);
  }

  toggleDeathMode() {
    this.api.send("toggleDeathMode", { roomId: this.roomId });
  }

  onProgress(p: IArenaProgress) {
    this.api.send("progress", {
      roomId: this.roomId,
      wpm: p.wpm || 0,
      accuracy: p.accuracy || 0,
      percentage: p.percentage || 0,
      dead: p.dead || false
    });
  }

  shareLink() {
    const linkEl = document.getElementById("share-link")!;
    const prevText = linkEl.innerText;
    if (prevText === "Copied!") {
      return;
    }
    copyToClipboard(window.location.href);
    linkEl.innerText = "Copied!"
    setTimeout(() => linkEl.innerText = prevText, 2000);
  }

  generateSystemMessage(text: string) {
    const chatMsg = {
      id: "-1",
      client: getSystemClient(),
      time: "00:00:00",
      text,
      isSystem: true
    };
    this.chatMessages.update(prev => [...prev, chatMsg]);
    scrollToBottom(".chat");
  }

  sendChatMessage(text: string, isSystem = false) {
    if (!text) {
      return;
    }

    this.api.send("chat", {
      roomId: this.roomId,
      text,
      isSystem
    });

    if (!isSystem) {
      this.chatMessage.setValue("");
    }
  }

  async flickAnimation(el: Element | null) {
    if (el) {
      el.classList.remove("animation");
      await delay(0.1);
      el.classList.add("animation");
    }
  }

  async countdownAnimation(cb: Function) {
    this.countdownRunning.set(true);
    const countdown = document.querySelector(".countdown");
    for (const num of [5, 4, 3, 2, 1]) {
      this.countdown.set(num);
      this.flickAnimation(countdown);
      this.generateSystemMessage(`Game starts in ${num} seconds`);
      await delay(1);
    }
    this.generateSystemMessage("Game started. Good luck!");
    this.countdownExpired.set(true);
    this.countdownRunning.set(false);
    cb();
  }

  handleChatReceived(msg: IChatReceivedMessage) {
    this.chatMessages.update(prev => [...prev, msg]);
    scrollToBottom(".chat");
  }

  handleRoomDetailsReceived(msg: IRoomDetailsReceivedMessage) {
    this.room.set(msg.room);

    if (!this.initializedRoom()) {
      this.loaderService.isLoading.set(false);
      if (msg.room.race.isRunning) {
        this.raceStarted.set(true);
        this.generateSystemMessage("Game already started");
        focus("#text-control");
      } else {
        this.generateSystemMessage("Waiting for host to start the game...");
      }
    }
    this.initializedRoom.set(true);
  }

  handleClientJoined(msg: IClientWithRoomMessage) {
    this.generateSystemMessage(`Client ${ellipsis(msg.client.name, 15)} joined the room`);
  }

  handleClientLeft(msg: IClientWithRoomMessage) {
    this.generateSystemMessage(`Client ${ellipsis(msg.client.name, 15)} left the room`);
  }

  startGame() {
    this.api.send("startGame", { roomId: this.roomId });
  }

  newGame() {
    this.api.send("newGame", { roomId: this.roomId });
  }

  handleGameStarted() {
    this.countdownAnimation(() => {
      this.raceStarted.set(true);
      this.arenaComponent.focusTextControl();
    });
  }

  handleGameResetted() {
    this.generateSystemMessage("A new game has been created.");
    this.raceStarted.set(false);
    this.countdownExpired.set(false);
    this.gold.set("");
    this.silver.set("");
    this.bronze.set("");
    this.arenaComponent.reset();
    scrollToTop("#arena-text");
  }

  handleProgressReceived(msg: IProgressReceivedMessage) {
    const room = this.room();
    if (!room) {
      return console.error("Room not found");
    }

    const winners = msg.winners;
    const { gold, silver, bronze } = winners;
    const players = msg.players;

    if (!this.gold() && gold && players[gold]) {
      this.gold.set(gold);
      this.generateSystemMessage(`User ${ellipsis(players[gold]?.name, 15)} got the gold medal!`);
    }
    if (!this.silver() && silver && players[silver]) {
      this.silver.set(silver);
      this.generateSystemMessage(`User ${ellipsis(players[silver]?.name, 15)} got the silver medal!`);
    }
    if (!this.bronze() && bronze && players[bronze]) {
      this.bronze.set(bronze);
      this.generateSystemMessage(`User ${ellipsis(players[bronze]?.name, 15)} got the bronze medal!`);
    }

    this.room.set({
      ...room,
      race: {
        ...room.race,
        players,
        winners
      }
    });
  }
}
