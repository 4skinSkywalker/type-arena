//      ██╗      ██████╗  █████╗  ██████╗██╗  ██╗███████╗███╗   ██╗██████╗ 
//      ╚██╗     ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝████╗  ██║██╔══██╗
// █████╗╚██╗    ██████╔╝███████║██║     █████╔╝ █████╗  ██╔██╗ ██║██║  ██║
// ╚════╝██╔╝    ██╔══██╗██╔══██║██║     ██╔═██╗ ██╔══╝  ██║╚██╗██║██║  ██║
//      ██╔╝     ██████╔╝██║  ██║╚██████╗██║  ██╗███████╗██║ ╚████║██████╔╝
//      ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚═════╝                                                                                                                           
export interface IClientToJSONOptions {
    includeRoom?: boolean;
}

export interface IRoomToJSONOptions {
    includeClients?: boolean;
}

export interface IAudioMessage {
    roomId: string;
    clientId: string;
    data: number[];
}

export interface IQuote {
    author: string;
    bio: string;
    quote: string;
    source: string;
}

export interface IRace {
    quote: IQuote;
    isRunning: boolean;
    players: Record<string, IClientWithPercentage>;
    winners: {
        gold: string | null;
        silver: string | null;
        bronze: string | null;
    }
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
}

export interface IRoomJSON {
    id: string;
    name: string;
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

export interface IProgressDetails {
    wpm: number;
    accuracy: number;
    percentage: number;
}

export interface IProgressMessage extends IProgressDetails {
    roomId: string;
}

export interface ICreateRoomMessage {
    roomId?: string;
    name: string;
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
    room: IRoomJSON;
    client: IClientJSON;
    time: string;
    text: string;
    isSystem?: boolean;
}

export interface IRoomDetailsReceivedMessage {
    room: IRoomJSON;
}

export interface IClientWithRoomMessage {
    client: IClientJSON;
    room: IRoomJSON;
}

export interface IProgressReceivedMessage {
    room: IRoomJSON;
}
