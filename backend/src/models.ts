//      ██╗      ██████╗  █████╗  ██████╗██╗  ██╗███████╗███╗   ██╗██████╗ 
//      ╚██╗     ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝████╗  ██║██╔══██╗
// █████╗╚██╗    ██████╔╝███████║██║     █████╔╝ █████╗  ██╔██╗ ██║██║  ██║
// ╚════╝██╔╝    ██╔══██╗██╔══██║██║     ██╔═██╗ ██╔══╝  ██║╚██╗██║██║  ██║
//      ██╔╝     ██████╔╝██║  ██║╚██████╗██║  ██╗███████╗██║ ╚████║██████╔╝
//      ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚═════╝                                                                                                                           

export type Language = "en" | "it";

export interface IClientToJSONOptions {
    includeRoom?: boolean;
}

export interface IRoomToJSONOptions {
    includeClients?: boolean;
}

export interface IQuote {
    author: string;
    bio: string;
    quote: string;
    source: string;
}

export interface IWinners {
    gold: string | null;
    silver: string | null;
    bronze: string | null;
}

export interface IRace {
    quote: IQuote;
    isRunning: boolean;
    players: Record<string, IClientWithPercentage>;
    winners: IWinners;
}

export interface IClientJSON {
    id: string;
    name: string;
    car: number;
    wpm: number;
    accuracy: number;
    room?: IRoomJSON;
}

export interface IClientWithPercentage extends IClientJSON {
  percentage: number;
  dead: boolean;
  deadPercentage?: number;
}

export interface IRoomJSON {
    id: string;
    name: string;
    deathMode: boolean;
    language: Language;
    race: IRace;
    host: IClientJSON;
    clients: IClientJSON[];
}

export interface IClientInfoMessage {
    name: string;
    car: number;
    wpm: number;
    accuracy: number;
}

export interface IChatMessage {
    roomId: string;
    text: string;
    isSystem?: boolean;
}

export interface IIsTypingChat {
    roomId: string;
}

export interface IProgressDetails {
    wpm: number;
    accuracy: number;
    percentage: number;
    dead: boolean;
    deadPercentage?: number;
}

export interface IProgressMessage extends IProgressDetails {
    roomId: string;
}

export interface ICreateRoomMessage {
    roomId?: string;
    name: string;
    deathMode: boolean;
    language: Language;
}

export interface IJoinRoomMessage {
    roomId: string;
}

export interface IRoomDetailsMessage {
    roomId: string;
}

export interface IStartGameMessage {
    roomId: string;
}

//      ██╗      ███████╗██████╗  ██████╗ ███╗   ██╗████████╗███████╗███╗   ██╗██████╗ 
//      ╚██╗     ██╔════╝██╔══██╗██╔═══██╗████╗  ██║╚══██╔══╝██╔════╝████╗  ██║██╔══██╗
// █████╗╚██╗    █████╗  ██████╔╝██║   ██║██╔██╗ ██║   ██║   █████╗  ██╔██╗ ██║██║  ██║
// ╚════╝██╔╝    ██╔══╝  ██╔══██╗██║   ██║██║╚██╗██║   ██║   ██╔══╝  ██║╚██╗██║██║  ██║
//      ██╔╝     ██║     ██║  ██║╚██████╔╝██║ ╚████║   ██║   ███████╗██║ ╚████║██████╔╝
//      ╚═╝      ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═══╝╚═════╝ 

export interface IWhoAmIReceivedMessage {
    client: IClientJSON;
}

export interface IClientsListedMessage {
    clients: IClientJSON[];
}

export interface IRoomsListedMessage {
    rooms: IRoomJSON[];
}

export interface IClientLeftRoomMessage {
    room: IRoomJSON;
    client: IClientJSON;
}

export interface IChatReceivedMessage {
    id: string;
    client: IClientJSON;
    time: string;
    text: string;
    isSystem?: boolean;
}

export interface IIsTypingChatReceived {
    client: IClientJSON;
}

export interface IRoomDetailsReceivedMessage {
    room: IRoomJSON;
}

export interface IClientWithRoomMessage {
    client: IClientJSON;
    room: IRoomJSON;
}

export interface IProgressReceivedMessage {
    players: Record<string, IClientWithPercentage>;
    winners: IWinners;
}
