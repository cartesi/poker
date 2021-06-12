import { LobbyMock } from "./mock/LobbyMock";
import { LobbyWeb3 } from "./web3/LobbyWeb3";

declare let window: any;
export class Lobby {
    public static readonly TEXAS_HODLEM_TEMPLATE_HASH =
        "0xa4c9cc22be3cefe90f6a2332ffd3b12e4fcc327112a90dcc12207ad5154e8207";
    public static readonly TEXAS_HODLEM_METADATA = "0x";
    public static readonly VALIDATORS_LOCALHOST = [
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    ];
    public static readonly NUM_PLAYERS = 2;
    public static readonly MIN_FUNDS = 10;

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
