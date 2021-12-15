import { ServiceConfig, ServiceType, ServiceImpl } from "./ServiceConfig";
import { LobbyMock } from "./mock/LobbyMock";
import { LobbyWeb3 } from "./web3/LobbyWeb3";

export class Lobby {
    /**
     * Joins a new Texas Holdem game
     *
     * @param playerFunds funds being brought to the game
     * @param playerInfo JSON object with descriptive information (name, avatar) about the player joining
     * @param gameReadyCallback callback to be called once game is ready to start, receiving two arguments: the new game's index and its full context (players involved, etc)
     */
    public static joinGame(playerInfo: object, gameReadyCallback) {
        const impl = ServiceConfig.get(ServiceType.Transport);
        if (impl === ServiceImpl.Mock) {
            // mock lobby
            LobbyMock.joinGame(playerInfo, gameReadyCallback);
        } else if (impl == ServiceImpl.Web3) {
            // web3 lobby
            LobbyWeb3.getInstance().joinGame(playerInfo, gameReadyCallback);
        } else {
            // unknown implementation configured
            throw `Unknown transport configuration '${impl}'!`;
        }
    }

    /**
     * Leaves Texas Holdem game queue
     */
    public static async leaveQueue(): Promise<void> {
        const impl = ServiceConfig.get(ServiceType.Transport);
        if (impl === ServiceImpl.Mock) {
            // mock lobby: nothing to do (no real queue to leave)
        } else if (impl == ServiceImpl.Web3) {
            // web3 lobby
            await LobbyWeb3.getInstance().leaveQueue();
        } else {
            // unknown implementation configured
            throw `Unknown transport configuration '${impl}'!`;
        }
    }
}
