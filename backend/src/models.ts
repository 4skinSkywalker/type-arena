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
    includeProblem?: boolean;
}

export interface IAudioMessage {
    roomId: string;
    clientId: string;
    data: number[];
}

export interface ILogMessage {
    level: "log" | "warn" | "error";
    text: string;
}

export interface ITest {
    input: any;
    expectedOutput: any;
    status?: "running" | "passed" | "failed";
    output?: any;
    logs?: ILogMessage[];
}

export interface IProblem {
    filename: string;
    title: string;
    description: string;
    tests: ITest[];
    rating: number;
}

export interface IClientJSON {
    id: string;
    name: string;
    room?: IRoomJSON;
}

export interface IRoomJSON {
    id: string;
    name: string;
    enableLateJoin: boolean;
    started: boolean;
    problem?: IProblem;
    host: IClientJSON;
    clients: IClientJSON[];
}

export interface IClientInfoMessage {
    name: string;
}

export interface IChatMessage {
    roomId: string;
    text: string;
    isSystem?: boolean;
}

export interface IProgressDetails {
    testsPassed?: number;
    charCount?: number;
    editorContent?: string;
}

export interface IProgressMessage extends IProgressDetails {
    roomId: string;
}

export interface ICreateRoomMessage {
    roomId?: string;
    name: string;
    enableLateJoin: boolean;
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

export interface IGetProblemMessage {
    filename: string;
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

export interface IProgressReceivedMessage extends IClientWithRoomMessage, IProgressDetails {}

export interface IProblemSnippet {
    filename: string;
    title: string;
    rating: number;
}

export interface IProblemTitlesReceivedMessage {
    problemTitles: Array<IProblemSnippet>;
}

export interface IProblemWithNext extends IProblem {
    nextProblemFilename?: string | null;
}

export interface IGetProblemReceivedMessage {
    problem: IProblemWithNext;
}