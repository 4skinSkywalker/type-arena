import { IClientJSON, IRace, IRoomJSON, IWinners } from "../../../../../backend/src/models";

export const DEATH_MODE_COLOR = "230, 90, 30";
export const NORMAL_MODE_COLOR = "250, 139, 6";

export function getSystemClient(): IClientJSON {
    return {
        id: "-1",
        name: "",
        car: 0,
        wpm: 0,
        accuracy: 1,
        room: undefined
    };
}

export function getDefaultWinners(): IWinners {
    return {
        gold: null,
        silver: null,
        bronze: null
    };
}