import { getUid, parseEvent } from "./utils";
import WebSocket from 'ws';
import { IChatMessage, IClientJSON, IRoomJSON, IProgressMessage, ICreateRoomMessage, IJoinRoomMessage, IRoomDetailsMessage, IStartGameMessage, IClientInfoMessage, IRoomToJSONOptions, IClientToJSONOptions, IAudioMessage, IRace, IClientWithPercentage, IQuote, Language } from "./models";
import { getRandomQuote } from "./quotes";

const globalRooms = new Map<string, Room>();
const globalClients = new Map<string, Client>();

function sendEverybodyClients() {
    console.log("Sending clients to every client");
    for (const client of globalClients.values()) {
        client.send("clientsListed", {
            clients: Array.from(globalClients.values())
                .map(item => item.toJSON())
        });
    }
}

function sendEverybodyRooms() {
    console.log("Sending rooms to every client");
    for (const client of globalClients.values()) {
        client.send("roomsListed", {
            rooms: Array.from(globalRooms.values())
                .map(item => item.toJSON())
        });
    }
}

class Client {
    ws: WebSocket;
    id = getUid();
    name = "Anonymous";
    car = 1;
    wpm = 0;
    accuracy = 0;
    room?: Room = undefined;
    handlers: Record<string, (msg: any) => void> = {
        "voice": this.handleVoice.bind(this),
        "whoAmI": this.handleWhoAmI.bind(this),
        "clientInfo": this.handleClientInfo.bind(this),
        "ping": this.handlePing.bind(this),
        "chat": this.handleChat.bind(this),
        "progress": this.handleProgress.bind(this),
        "listClients": this.handleListClients.bind(this),
        "listRooms": this.handleListRooms.bind(this),
        "createRoom": this.handleCreateRoom.bind(this),
        "joinRoom": this.handleJoinRoom.bind(this),
        "leaveRoom": this.handleLeaveRoom.bind(this),
        "roomDetails": this.handleRoomDetails.bind(this),
        "startGame": this.handleStartGame.bind(this),
        "newGame": this.handleNewGame.bind(this),
        "toggleDeathMode": this.handleToggleDeathMode.bind(this),
    };

    constructor(ws: WebSocket) {
        this.ws = ws;
        this.ws.on("message", (message: unknown) => this.handleMessage(message));
        this.ws.on("close", () => this.handleClose());
        globalClients.set(this.id, this);
    }

    getRoom() {
        if (!this.room) {
            throw new Error("Not in a room");
        }
        return this.room;
    }

    send(topic: string, message?: {}) {
        this.ws.send(JSON.stringify({ topic, message }));
    }

    handleVoice(msg: IAudioMessage) {
        this.getRoom().sendVoice(msg);
    }

    handleWhoAmI() {
        console.log("Sending client his/her info");
        this.send("whoAmIReceived", { client: this.toJSON({ includeRoom: true }) });
    }

    handleClientInfo(msg: IClientInfoMessage) {
        console.log(`Client with id ${this.id} has name ${msg.name} and car ${msg.car}`);
        this.name = msg.name;
        this.car = msg.car;
        this.wpm = msg.wpm;
        this.accuracy = msg.accuracy;
        this.handleWhoAmI();
        sendEverybodyClients();
    }

    handlePing() {
        this.send("pong");
    }
    
    handleChat(msg: IChatMessage) {
        this.getRoom().sendChatMessage(msg.text, this, msg.isSystem);
    }
    
    handleProgress(msg: IProgressMessage) {
        this.getRoom().sendProgress(this, msg);
    }

    handleListClients() {
        console.log("Sending clients to requester");
        this.send("clientsListed", {
            clients: Array.from(globalClients.values()).map(item => item.toJSON())
        });
    }
    
    handleListRooms() {
        console.log("Sending rooms to requester");
        this.send("roomsListed", {
            rooms: Array.from(globalRooms.values()).map(item => item.toJSON())
        });
    }

    handleCreateRoom(msg: ICreateRoomMessage) {
        console.log("Creating room", msg.name);
        this.room = new Room({
            id: msg.roomId,
            name: msg.name,
            deathMode: msg.deathMode,
            language: msg.language,
            host: this
        });
        this.send("roomCreated", { room: this.room.toJSON() });
        sendEverybodyRooms();
    }

    handleJoinRoom(msg: IJoinRoomMessage) {
        const room = globalRooms.get(msg.roomId);
        if (room) {
            console.log("User joining room", msg.roomId);
            this.room = room;
            this.room.addClient(this);
        } else {
            console.warn("Room not found, creating it");
            this.handleCreateRoom({
                roomId: msg.roomId,
                name: "Untitled",
                deathMode: false,
                language: "en"
            });
        }
    }

    handleLeaveRoom(msg: IJoinRoomMessage) {
        const room = globalRooms.get(msg.roomId);
        if (room) {
            this.handleClose(false);
        }
    }

    handleRoomDetails(msg: IRoomDetailsMessage) {
        const room = this.getRoom();
        if (!room.clients.has(this.id)) {
            throw new Error("Client not in room");
        }
        console.log("Room status of room", msg.roomId);
        room.sendRoomDetails(this);
    }

    handleStartGame(msg: IStartGameMessage) {
        const room = this.getRoom();
        if (!room.clients.has(this.id)) {
            throw new Error("Client not in room");
        }
        if (room.host !== this) {
            throw new Error("Only the host can start the game");
        }
        room.startGame();
    }

    handleNewGame(msg: IStartGameMessage) {
        const room = this.getRoom();
        if (!room.clients.has(this.id)) {
            throw new Error("Client not in room");
        }
        if (room.host !== this) {
            throw new Error("Only the host can reset the game");
        }
        room.newGame();
    }

    handleMessage(event: any) {
        try {
            const { topic, message } = parseEvent(event);
            if (!this.handlers[topic]) {
                throw new Error("Topic not recognized");
            }
            this.handlers[topic](message);
        } catch (error: any) {
            console.error(error.message || error);
        }
    }

    handleToggleDeathMode() {
        const room = this.getRoom();
        if (!room.clients.has(this.id)) {
            throw new Error("Client not in room");
        }
        if (room.host !== this) {
            throw new Error("Only the host can toggle death mode");
        }
        room.deathMode = !room.deathMode;
        room.sendRoomDetails(this);
    }

    handleOpen() {
        this.handleWhoAmI();
    }

    handleClose(disconnecting = true) {
        if (this.room) {
            console.log(`Client "${this.name}" (${this.id}) is leaving the room "${this.room.name}" (${this.room.id})`);
            this.room.removeClient(this);
        
            if (!this.room.deleteFromGlobalIfEmpty() && this.room.host.id === this.id) {
                this.room.passHostToNextClient();
            }

            sendEverybodyRooms();
        }
        
        if (disconnecting) {
            console.log(`Client "${this.name}" (${this.id}) disconnected`);
            globalClients.delete(this.id); 
            sendEverybodyClients();
        }
    }

    toJSON(opts?: IClientToJSONOptions): IClientJSON {
        opts = opts || {};
        const includeRoom = opts.includeRoom == null ? true : opts.includeRoom;
        return {
            id: this.id,
            name: this.name,
            car: this.car,
            wpm: this.wpm,
            accuracy: this.accuracy,
            room: includeRoom
                ? this.room?.toJSON()
                : undefined
        };
    }
}

class Room {
    id: string;
    name: string;
    race: IRace;
    deathMode = false;
    language: Language = "en";
    host: Client;
    clients = new Map<string, Client>();

    constructor(opts: {
        id?: string,
        name: string,
        deathMode: boolean,
        language: Language,
        host: Client
    }) {
        this.id = opts.id || getUid();
        this.name = opts.name;
        this.deathMode = opts.deathMode;
        this.language = opts.language;
        this.race = this.createRace();
        this.host = opts.host;
        this.addClient(opts.host);
        globalRooms.set(this.id, this);
    }

    sendVoice(msg: IAudioMessage) {
        for (const [clientId, client] of this.clients.entries()) {
            if (clientId !== msg.clientId) {
                client.send("voiceReceived", msg);
            }
        }
    }

    createRace(players?: Record<string, IClientWithPercentage>, oldQuote?: IQuote): IRace {
        let randomQuote = getRandomQuote(this.language);
        while (randomQuote.quote === oldQuote?.quote) {
            randomQuote = getRandomQuote(this.language);
        }
        return {
            quote: randomQuote,
            isRunning: false,
            players: { ...players },
            winners: {
                gold: null,
                silver: null,
                bronze: null
            }
        };
    }

    startGame() {
        console.log("Game starting in room", this.id);

        this.race.isRunning = true;

        for (const client of this.clients.values()) {
            client.send("gameStarted");
            this.sendRoomDetails(client);
        }

        sendEverybodyRooms();
    }

    newGame() {
        console.log("Game resetting in room", this.id);

        this.race.isRunning = false;

        // Reset players state
        for (const player of Object.values(this.race.players)) {
            player.percentage = 0;
            player.dead = false;
            player.deadPercentage = undefined;
        }
        this.race = this.createRace(this.race.players, this.race.quote);

        for (const client of this.clients.values()) {
            client.send("gameResetted");
            this.sendRoomDetails(client);
        }

        sendEverybodyRooms();
    }

    sendChatMessage(text: string, client: Client, isSystem = false) {
        console.log(`Client "${client.name}" (${client.id}) sent chat message "${text}" in room "${this.name}" (${this.id})`);
        for (const _client of this.clients.values()) {
            _client.send("chatReceived", {
                id: getUid(),
                room: this.toJSON(),
                client: client.toJSON(),
                time: new Date().toLocaleTimeString(),
                text,
                isSystem,
            });
        }
    }

    sendProgress(client: Client, msg: IProgressMessage) {
        if (!this.race.players[client.id]) {
            return console.error("Client not in race", client.id);
        }

        this.race.players[client.id] = {
            ...client.toJSON({ includeRoom: false }),
            wpm: msg.wpm,
            accuracy: msg.accuracy,
            percentage: msg.dead
                ? this.race.players[client.id].percentage
                : msg.percentage,
            dead: this.race.players[client.id].dead
                ? true
                : msg.dead,
            deadPercentage: msg.dead
                ? msg.percentage
                : undefined
        };

        const percentage = this.race.players[client.id].percentage;
        if (percentage >= 1) {
            let shouldSend = false;
            if (this.race.winners.gold === null) {
                this.race.winners.gold = client.id;
                console.log(`Client ${client.name} got the gold medal`);
                shouldSend = true;
            } else if (this.race.winners.silver === null) {
                this.race.winners.silver = client.id;
                console.log(`Client ${client.name} got the silver medal`);
                shouldSend = true;
            } else if (this.race.winners.bronze === null) {
                this.race.winners.bronze = client.id;
                console.log(`Client ${client.name} got the bronze medal`);
                shouldSend = true;
            } else {
                console.log(`Client ${client.name} got no medal`);
            }

            if (shouldSend) {
                this.sendRoomDetails();
            }
        }

        for (const _client of this.clients.values()) {
            _client.send("progressReceived", { room: this.toJSON({ includeClients: false }) });
        }
    }

    sendRoomDetails(client?: Client) {
        if (client) {
            // Send to the client that requested the details
            client.send("roomDetailsReceived", {
                room: this.toJSON()
            });
        } else {
            // Send to all clients in the room
            for (const _client of this.clients.values()) {
                _client.send("roomDetailsReceived", {
                    room: this.toJSON()
                });
            }
        }
    }

    passHostToNextClient() {
        const clients = Array.from(this.clients.values());
        if (!clients.length) {
            throw new Error("Room has no clients");
        }

        const previousHost = this.host;
        this.host = clients[0];
        console.log(`Room "${this.name}" (${this.id}) host changed from ${previousHost.name} (${previousHost.id}) to ${this.host.name} (${this.host.id})`);
        
        this.sendRoomDetails();
    }

    addClient(client: Client) {
        if (this.clients.has(client.id)) {
            return console.error("Client already in room");
        }

        this.clients.set(client.id, client);
        for (const _client of this.clients.values()) {
            _client.send("clientJoined", {
                room: this.toJSON(),
                client: client.toJSON({ includeRoom: false })
            });
        }

        // If the room doens't have a host, set it to this new client
        if (!this.clients.has(this.host.id)) {
            this.host = client;
        }

        this.race.players[client.id] = {
            ...client.toJSON({ includeRoom: false }),
            percentage: 0,
            dead: false,
            deadPercentage: undefined
        };
        console.log("Added client", client.id, "to race");

        this.sendRoomDetails();
    }

    removeClient(client: Client) {
        if (!this.clients.has(client.id)) {
            return false;
        }

        this.clients.delete(client.id);
        for (const _client of this.clients.values()) {
            _client.send("clientLeft", {
                room: this.toJSON(),
                client: client.toJSON({ includeRoom: false })
            });
        }

        delete this.race.players[client.id];
        console.log("Deleted client", client.id, "from race");

        this.sendRoomDetails();

        return true;
    }

    deleteFromGlobalIfEmpty() {
        if (!this.clients.size) {
            // Wait 30 seconds before deleting the room
            setTimeout(() => {
                if (!this.clients.size) {
                    globalRooms.delete(this.id);
                    sendEverybodyRooms();
                }
            }, 30 * 1000);
            return true;
        }
        return false;
    }

    toJSON(opts?: IRoomToJSONOptions): IRoomJSON {
        opts = opts || {};
        return {
            id: this.id,
            name: this.name,
            deathMode: this.deathMode,
            language: this.language,
            race: this.race,
            host: this.host.toJSON({ includeRoom: false }),
            clients: Array.from(this.clients.values())
                .map(client => client.toJSON({ includeRoom: false }))
        };
    }
}

export function handleConnection(ws: WebSocket) {
    const client = new Client(ws);
    console.log(`Client with id ${client.id} connected`);
}