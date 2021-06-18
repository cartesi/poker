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
        if (window.location.search && window.location.search.includes("mock")) {
            LobbyMock.joinGame(playerInfo, gameReadyCallback);
        } else {
            LobbyWeb3.joinGame(playerInfo, gameReadyCallback);
        }
    }
}
