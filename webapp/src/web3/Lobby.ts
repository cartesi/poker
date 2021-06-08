import { ethers } from "ethers";
import TurnBasedGame from "../abis/TurnBasedGame.json";
import TurnBasedGameContext from "../abis/TurnBasedGameContext.json";
import TurnBasedGameLobby from "../abis/TurnBasedGameLobby.json";
import PokerToken from "../abis/PokerToken.json";
import { TurnBasedGame__factory } from "../types/factories/TurnBasedGame__factory";
import { TurnBasedGameContext__factory } from "../types/factories/TurnBasedGameContext__factory";
import { TurnBasedGameLobby__factory } from "../types/factories/TurnBasedGameLobby__factory";

declare let window: any;
export class Lobby {
    private static readonly TEXAS_HODLEM_TEMPLATE_HASH =
        "0xa4c9cc22be3cefe90f6a2332ffd3b12e4fcc327112a90dcc12207ad5154e8207";
    private static readonly TEXAS_HODLEM_METADATA = "0x";
    private static readonly VALIDATORS_LOCALHOST = [
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    ];
    private static readonly NUM_PLAYERS = 2;
    private static readonly MIN_FUNDS = 10;

    /**
     * Joins a new Texas Holdem game
     *
     * @param playerInfo JSON object with descriptive information (name, avatar) about the player joining
     * @param funds funds being brought to the game
     * @param gameReadyCallback callback to be called once game is ready to start, receiving two arguments: the new game's index and its full context (players involved, etc)
     */
    public static async joinGame(playerInfo: object, funds: number, gameReadyCallback) {
        if (!window.ethereum) {
            console.error("Cannot connect to window.ethereum. Is Metamask or a similar plugin installed?");
            return;
        }

        // connect to ethereum
        await window.ethereum.request({ method: "eth_requestAccounts" });

        // retrieves provider + signer (e.g., from metamask)
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // connects to the TurnBasedGame and TurnBasedGameLobby contracts
        const gameContract = TurnBasedGame__factory.connect(TurnBasedGame.address, signer);
        const contextContract = TurnBasedGameContext__factory.connect(TurnBasedGameContext.address, signer);
        const lobbyContract = TurnBasedGameLobby__factory.connect(TurnBasedGameLobby.address, signer);

        contextContract.on("GameReady", (index, context) => {
            console.log(`index: ${index}`);
            console.log(`context: ${JSON.stringify(context)}`);
        });

        lobbyContract.joinGame(
            Lobby.TEXAS_HODLEM_TEMPLATE_HASH,
            Lobby.TEXAS_HODLEM_METADATA,
            Lobby.VALIDATORS_LOCALHOST,
            Lobby.NUM_PLAYERS,
            Lobby.MIN_FUNDS,
            funds,
            PokerToken.address,
            ethers.utils.toUtf8Bytes(JSON.stringify(playerInfo))
        );

        // FIXME: this is a mock implementation
        // - the real impl should call TurnBasedGameLobby.joinGame() and wait for TurnBasedGame.GameReady event

        if (funds < this.MIN_FUNDS) {
            throw `Player's staked funds (${funds}) is insufficient to join the game (minimum is ${this.MIN_FUNDS}).`;
        }

        var index = 0;
        var opponentAvatar = Math.ceil(Math.random() * 6);
        console.log(`opponentAvatar: ${opponentAvatar}`);
        var context = {
            gameTemplateHash: Lobby.TEXAS_HODLEM_TEMPLATE_HASH,
            gameMetadata: Lobby.TEXAS_HODLEM_METADATA,
            players: Lobby.VALIDATORS_LOCALHOST,
            playerFunds: [funds, 100],
            playerInfos: [playerInfo, { name: "Bob", avatar: opponentAvatar }],
        };
        setTimeout(() => gameReadyCallback(index, context), 6000);
    }
}
