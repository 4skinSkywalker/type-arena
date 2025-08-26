import { Component, computed, effect, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ApiService, Handlers } from '../../services/api.service';
import { check, deepCopy, delay, uncheck, copyToClipboard } from '../../shared/utils';
import { IChatReceivedMessage, IClientJSON, IClientWithPercentage, IClientWithRoomMessage, IProgressDetails, IProgressReceivedMessage, IRoomDetailsReceivedMessage, IRoomJSON } from '../../../../../backend/src/models';
import { BasicModule } from '../../basic.module';
import { FormControl } from '@angular/forms';
import { LoaderService } from '../../components/loader/loader-service.service';
import { getFakeClient, getFakeRoom } from './game-multiplayer.util';
import { VoipService } from '../../services/voip.service';
import { ArenaComponent } from '../../components/arena/arena.component';

@Component({
  selector: 'app-game-multiplayer',
  imports: [BasicModule, ArenaComponent],
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
  hasGameStarted = computed(() => this.alreadyStartedOnInit() || (this.roomStarted() && this.countdownExpired()));
  quote = signal("");
  gold = signal("");
  silver = signal("");
  bronze = signal("");
  clientProgressDataMap = signal<Record<string, IProgressDetails>>({});
  clients = computed<IClientJSON[]>(() => [...(this.room()?.clients || [])]);
  clientsSortByPercentage = computed<IClientWithPercentage[]>(() => 
    [...(this.room()?.clients || [])]
      .map(client => ({
        ...deepCopy(client),
        percentage: this.clientProgressDataMap()?.[client.id]?.percentage || 0
      }))
      .sort((a, b) => b.percentage - a.percentage)
  );
  me = computed<IClientWithPercentage | null>(() => 
    this.clientsSortByPercentage()
      .find(client => client.id === this.client()?.id) || null
  );
  others = computed<IClientWithPercentage[]>(() =>
    this.clientsSortByPercentage()
      .filter(client => client.id !== this.client()?.id)
      .sort((a, b) => a.id > b.id ? 1 : -1)
  );

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
    this.api.send("joinRoom", { roomId: this.roomId });
    this.api.send("roomDetails", { roomId: this.roomId });
  }

  ngOnDestroy() {
    this.api.unsubscribe(this.handlers);
    this.loaderService.isLoading.set(false);
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
    this.alreadyStartedOnInit.set(false);
    this.roomStarted.set(false);
    this.countdownExpired.set(false);
    this.gold.set("");
    this.silver.set("");
    this.bronze.set("");
  }

  handleGameStarted() {
    this.resetGame();
    this.countdownAnimation();
  }

  handleProgressReceived(msg: IProgressReceivedMessage) {
    const gold = this.room()?.race.winners.gold;
    const silver = this.room()?.race.winners.silver;
    const bronze = this.room()?.race.winners.bronze;
    if (!this.gold() && gold) {
      this.generateSystemMessage(`User ${gold} got the gold medal!`);
    }
    if (!this.silver() && silver) {
      this.generateSystemMessage(`User ${silver} got the silver medal!`);
    }
    if (!this.bronze() && bronze) {
      this.generateSystemMessage(`User ${bronze} got the bronze medal!`);
    }

    this.clientProgressDataMap.update(prev => ({
      ...prev,
      [msg.client.id]: {
        wpm: msg.wpm ?? prev[msg.client.id]?.wpm,
        accuracy: msg.accuracy ?? prev[msg.client.id]?.accuracy,
        percentage: msg.percentage ?? prev[msg.client.id]?.percentage
      }
    }));
    this.room.set(this.room()); // Recompute dependant signals
  }
}
