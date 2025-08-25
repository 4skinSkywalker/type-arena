import { Component, computed, effect, HostListener, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ApiService, Handlers } from '../../services/api.service';
import { focus, check, debounce, deepCopy, delay, drag, equal, matrixRain, uncheck, copyToClipboard, runInWorker } from '../../shared/utils';
import { IChatReceivedMessage, IClientJSON, IClientWithRoomMessage, IProgressDetails, IProgressReceivedMessage, IRoomDetailsReceivedMessage, IRoomJSON } from '../../../../../backend/src/models';
import { BasicModule } from '../../basic.module';
import { FormControl } from '@angular/forms';
import { LoaderService } from '../../components/loader/loader-service.service';
import { getFakeClient, getFakeRoom } from './game-multiplayer.util';
import { VoipService } from '../../services/voip.service';

@Component({
  selector: 'app-game-multiplayer',
  imports: [BasicModule],
  providers: [VoipService],
  templateUrl: './game-multiplayer.component.html',
  styleUrl: './game-multiplayer.component.scss'
})
export class GameMultiplayerComponent {
  JSON = JSON;
  check = check;
  uncheck = uncheck;
  roomId;
  chatMessages = signal<IChatReceivedMessage[]>([]);
  chatMessage = new FormControl("", { nonNullable: true });
  initializedRoom = signal(false);
  alreadyStartedOnInit = signal(false);
  room = signal<IRoomJSON | null | undefined>(null);
  client: Signal<IClientJSON | null | undefined>;
  isHost: Signal<boolean>;

  roomStarted = signal(false);
  countdown = signal(0);
  countdownRunning = signal(false);
  countdownExpired = signal(false);
  hasGameStarted = computed(() => 
    this.alreadyStartedOnInit() || 
    (this.roomStarted() && this.countdownExpired())
  );
  quote = signal("");
  clientProgressDataMap = signal<Record<string, IProgressDetails>>({});
  clients = computed<IClientJSON[]>(() => {
    return [...(this.room()?.clients || [])];
  });
  clientsSortByWpm = computed<IClientJSON[]>(() => {
    return [...(this.room()?.clients || [])]
      .map(client => ({
        ...deepCopy(client),
        wpm: this.clientProgressDataMap()?.[client.id]?.wpm || 0,
        accuracy: this.clientProgressDataMap()?.[client.id]?.accuracy || 1
      }))
      .sort((a, b) => b.wpm - a.wpm);
  });
  clientsSortByAccuracy = computed<IClientJSON[]>(() => {
    return [...(this.room()?.clients || [])]
      .map(client => ({
        ...deepCopy(client),
        wpm: this.clientProgressDataMap()?.[client.id]?.wpm || 0,
        accuracy: this.clientProgressDataMap()?.[client.id]?.accuracy || 1
      }))
      .sort((a, b) => a.accuracy - b.accuracy);
  });
  winnerName = signal("");
  matrixInterval: any;

  handlers: Handlers = {
    "chatReceived": this.handleChatReceived.bind(this),
    "roomDetailsReceived": this.handleRoomDetailsReceived.bind(this),
    "clientJoined": this.handleClientJoined.bind(this),
    "clientLeft": this.handleClientLeft.bind(this),
    "gameStarted": this.handleGameStarted.bind(this),
    "progressReceived": this.handleProgressReceived.bind(this),
  };

  constructor(
    public api: ApiService,
    public voip: VoipService,
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

    // Initialize voip
    this.voip.initialize(this.roomId);
    let voipCalling = this.voip.calling();
    effect(() => {
      const username = this.client()?.name || "Anonymous";
      if (voipCalling && !this.voip.calling()) {
        this.sendChatMessage(`${username} disconnected from voice chat`, true);
      } else if (this.voip.calling()) {
        this.sendChatMessage(`${username} connected to voice chat`, true);
      }
      voipCalling = this.voip.calling();
    });
  }

  ngOnInit() {
    (window as any).game = this;
    this.api.subscribe(this.handlers);
    this.loaderService.isLoading.set(true);
  }

  async ngAfterViewInit() {
    await delay(0.2);
    this.initGameResize();
    this.initContentResize();
    this.api.send("joinRoom", { roomId: this.roomId });
    this.api.send("roomDetails", { roomId: this.roomId });
  }

  ngOnDestroy() {
    this.api.unsubscribe(this.handlers);
    this.loaderService.isLoading.set(false);
    clearInterval(this.matrixInterval);
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

  initGameResize() {
    const gameContainer = document.querySelector(".game-container") as HTMLDivElement;
    const editorContainer = document.querySelector(".editor-container");
    const contentContainer = document.querySelector(".content-container");
    const sectionsDivider = document.querySelector(".sections-divider");
    drag({
      target: sectionsDivider,
      downCb: (evt: any, ctx: any) => {
        ctx.editorContainerWidth = editorContainer?.clientWidth;
        ctx.contentContainerWidth = contentContainer?.clientWidth;
      },
      moveCb: (evt: any, ctx: any) => {
        if (gameContainer) {
          gameContainer.style.gridTemplateColumns = `${ctx.editorContainerWidth + ctx.pos}px ${ctx.contentContainerWidth - ctx.pos}px`;
        }
      },
      direction: "x"
    });
  }

  initContentResize() {
    const contentContainer = document.querySelector(".content-container") as HTMLDivElement;
    const instructionsContainer = document.querySelector(".instructions-container");
    const chatContainer = document.querySelector(".chat-container");
    const chatTitle = document.querySelector(".chat-title");
    drag({
      target: chatTitle,
      downCb: (evt: any, ctx: any) => {
        ctx.instructionsContainerHeight = instructionsContainer?.clientHeight;
        ctx.chatContainerHeight = chatContainer?.clientHeight;
      },
      moveCb: (evt: any, ctx: any) => {
        if (contentContainer) {
          contentContainer.style.gridTemplateRows = `${ctx.instructionsContainerHeight + ctx.pos}px ${ctx.chatContainerHeight - ctx.pos}px`;
        }
      },
      direction: "y"
    });
  }

  async scrollToBottom(selector: string) {
    await delay(0.15);
    const el = document.querySelector(selector) as HTMLDivElement;
    el.scrollTop = el.scrollHeight;
  }

  generateSystemMessage(text: string) {
    const chatMsg = {
      id: "-1",
      room: getFakeRoom(),
      client: getFakeClient(),
      time: "00:00:00",
      text,
      isSystem: true,
    };
    this.chatMessages.update(prev => [...prev, chatMsg]);
    this.scrollToBottom(".chat");
  }

  sendChatMessage(text: string, isSystem = false) {
    this.api.send("chat", {
      roomId: this.roomId,
      text,
      isSystem,
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

  async countdownAnimation() {
    this.countdownRunning.set(true);
    const countdown = document.querySelector(".countdown");
    for (const num of [3, 2, 1]) {
      this.countdown.set(num);
      this.flickAnimation(countdown);
      this.generateSystemMessage(`Game starts in ${num} seconds`);
      await delay(1);
    }
    this.generateSystemMessage("Game started. Good luck!");
    this.countdownExpired.set(true);
    this.countdownRunning.set(false);
  }

  startGame() {
    this.api.send("startGame", { roomId: this.roomId });
  }

  gameOver() {
    this.generateSystemMessage(`Game over. User ${this.winnerName()} won the game!`);
    check("#game-over-trigger");
    focus(".game-over-modal button");
    this.matrixInterval = matrixRain("#matrix-canvas");
  }

  gameOverOk() {
    clearInterval(this.matrixInterval);
    uncheck("#game-over-trigger");
  }

  areYouSureNewGame() {
    check("#are-you-sure-new-game");
  }

  areYouSureNewGameOk() {
    this.api.send("restartGame", { roomId: this.roomId });
    uncheck("#are-you-sure-new-game");
  }

  kickPlayer() {
    alert("Not implemented yet"); // TODO
  }

  handleChatReceived(msg: IChatReceivedMessage) {
    this.chatMessages.update(prev => [...prev, msg]);
    this.scrollToBottom(".chat");
  }

  handleRoomDetailsReceived(msg: IRoomDetailsReceivedMessage) {
    this.room.set(msg.room);

    if (!this.initializedRoom()) {
      this.loaderService.isLoading.set(false);
      if (msg.room.race.isRunning) {
        this.alreadyStartedOnInit.set(true);
        this.generateSystemMessage("Game already started");
      }
    }
    this.initializedRoom.set(true);

    if (msg.room.race.quote && !this.roomStarted()) {
      this.roomStarted.set(msg.room.race.isRunning);
      this.quote.set(msg.room.race.quote.quote);
    }
  }

  handleClientJoined(msg: IClientWithRoomMessage) {
    this.generateSystemMessage(`Client ${msg.client.name} joined the room`);
  }

  handleClientLeft(msg: IClientWithRoomMessage) {
    this.generateSystemMessage(`Client ${msg.client.name} left the room`);
  }

  resetGame() {
    this.quote.set("");

    this.alreadyStartedOnInit.set(false);
    this.roomStarted.set(false);
    this.countdownExpired.set(false);
    this.winnerName.set("");

    this.api.send("progress", {
      roomId: this.roomId,
      wpm: 0,
      accuracy: 1
    });
  }

  handleGameStarted() {
    this.resetGame();
    this.countdownAnimation();
  }

  handleProgressReceived(msg: IProgressReceivedMessage) {
    // Does the player reached 100%?
    // Is there already a gold? No, then gold
    // Is there already a silver? No, then silver
    // Is there already a bronze? No, then bronze
    if (!this.winnerName() && msg.testsPassed === this.problemTests().length) {
      this.winnerName.set(msg.client.name);
      this.gameOver();
    }

    this.clientProgressDataMap.update(prev => ({
      ...prev,
      [msg.client.id]: {
        wpm: msg.wpm ?? prev[msg.client.id]?.wpm,
        accuracy: msg.accuracy ?? prev[msg.client.id]?.accuracy
      }
    }));
    this.room.set(this.room()); // Recompute dependant signals
  }
}
