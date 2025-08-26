import { getUid, parseEvent } from "./utils";
import WebSocket from 'ws';
import { IChatMessage, IClientJSON, IRoomJSON, IProgressMessage, ICreateRoomMessage, IJoinRoomMessage, IRoomDetailsMessage, IStartGameMessage, IClientInfoMessage, IRoomToJSONOptions, IClientToJSONOptions, IAudioMessage, IRace } from "./models";
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
    car = 0;
    wpm = 20;
    accuracy = 1;
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
        "roomDetails": this.handleRoomDetails.bind(this),
        "startGame": this.handleStartGame.bind(this),
        "restartGame": this.handleRestartGame.bind(this),
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
        console.log(`Client with id ${this.id} has name ${msg.name}`);
        this.name = msg.name;
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
            enableLateJoin: msg.enableLateJoin,
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
                name: "Untitled room",
                enableLateJoin: true
            });
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

    handleStartGame(msg: IStartGameMessage, bypass?: boolean) {
        const room = this.getRoom();
        if (!room.clients.has(this.id)) {
            throw new Error("Client not in room");
        }
        if (room.host !== this) {
            throw new Error("Only the host can start the game");
        }
        if (room.race.isRunning && !bypass) {
            throw new Error("Game already started");
        }
        room.setStarted(true);
    }

    handleRestartGame(msg: IStartGameMessage) {
        this.handleStartGame(msg, true);
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

    handleOpen() {
        this.handleWhoAmI();
    }

    handleClose() {
        if (this.room) {
            console.log(`Client "${this.name}" (${this.id}) is leaving the room "${this.room.name}" (${this.room.id})`);
            this.room.removeClient(this);
        
            if (!this.room.deleteFromGlobalIfEmpty() && this.room.host.id === this.id) {
                this.room.passHostToNextClient();
            }

            sendEverybodyRooms();
        }
        
        console.log(`Client "${this.name}" (${this.id}) disconnected`);
        globalClients.delete(this.id); 
        sendEverybodyClients();
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
    enableLateJoin: boolean;
    race = this.createRace();
    host: Client;
    clients = new Map<string, Client>();

    constructor(opts: {
        id?: string,
        name: string,
        enableLateJoin: boolean,
        host: Client
    }) {
        this.id = opts.id || getUid();
        this.name = opts.name;
        this.enableLateJoin = opts.enableLateJoin;
        this.host = opts.host;
        this.clients.set(opts.host.id, opts.host);
        globalRooms.set(this.id, this);
    }

    sendVoice(msg: IAudioMessage) {
        for (const [clientId, client] of this.clients.entries()) {
            if (clientId !== msg.clientId) {
                client.send("voiceReceived", msg);
            }
        }
    }

    createRace(): IRace {
        return {
            quote: getRandomQuote(),
            isRunning: false,
            winners: {
                gold: null,
                silver: null,
                bronze: null
            }
        };
    }

    setStarted(value: boolean) {
        console.log("Game starting in room", this.id);
        this.race = this.createRace();
        this.race.isRunning = value;

        for (const client of this.clients.values()) {
            client.send("gameStarted");
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
        for (const _client of this.clients.values()) {
            _client.send("progressReceived", {
                room: this.toJSON(),
                client: client.toJSON(),
                wpm: msg.wpm,
                accuracy: msg.accuracy,
                percentage: msg.percentage
            });
        }

        if (msg.percentage === 1) {
            let shouldSend = false;
            let shouldStop = false;
            if (this.race.winners.gold === null) {
                this.race.winners.gold = client.id;
                shouldSend = true;
                if (this.clients.size === 1) {
                    shouldStop = true;
                }
            } else if (this.race.winners.silver === null) {
                this.race.winners.silver = client.id;
                shouldSend = true;
                if (this.clients.size === 2) {
                    shouldStop = true;
                }
            } else if (this.race.winners.bronze === null) {
                this.race.winners.bronze = client.id;
                shouldSend = true;
                if (this.clients.size === 3) {
                    shouldStop = true;
                }
            }

            if (shouldSend) {
                if (shouldStop) {
                    this.race.isRunning = false;
                }
                this.sendRoomDetails();
            }
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
        this.sendRoomDetails();
        return true;
    }

    deleteFromGlobalIfEmpty() {
        if (!this.clients.size) {
            // Wait 15 minutes before deleting the room
            setTimeout(() => {
                if (!this.clients.size) {
                    globalRooms.delete(this.id);
                    sendEverybodyRooms();
                }
            }, 15 * 60 * 1000);
            return true;
        }
        return false;
    }

    toJSON(opts?: IRoomToJSONOptions): IRoomJSON {
        opts = opts || {};
        return {
            id: this.id,
            name: this.name,
            enableLateJoin: this.enableLateJoin,
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