import { IClientJSON, IRace, IRoomJSON, IWinners } from "../../../../../backend/src/models";

export function getFakeClient(): IClientJSON {
    return {
        id: "-1",
        name: "",
        car: 0,
        wpm: 0,
        accuracy: 1,
        room: undefined
    };
}

export function getFakeRace(): IRace {
    return {
        quote: {
            author: "",
            bio: "",
            quote: "",
            source: ""
        },
        isRunning: false,
        players: {},
        winners: {
            gold: null,
            silver: null,
            bronze: null
        }
    };
}

export function getFakeRoom(): IRoomJSON {
    return {
        id: "-1",
        name: "",
        race: getFakeRace(),
        host: getFakeClient(),
        clients: []
    };
}

export function getDefaultWinners(): IWinners {
    return {
        gold: null,
        silver: null,
        bronze: null
    };
}