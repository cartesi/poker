import { ethers } from "ethers";
import TurnBasedGame from "../abis/TurnBasedGame.json";
import TurnBasedGameContext from "../abis/TurnBasedGameContext.json";
import TurnBasedGameLobby from "../abis/TurnBasedGameLobby.json";
import PokerToken from "../abis/PokerToken.json";
import { TurnBasedGame__factory } from "../types";
import { TurnBasedGameContext__factory } from "../types";
import { TurnBasedGameLobby__factory } from "../types";
import { PokerToken__factory } from "../types";

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
        // TODO: switch between mock and real web3 impl according to a config
        this.joinGameMock(playerInfo, gameReadyCallback);
        // this.joinGameWeb3(playerInfo, gameReadyCallback);
    }

    /**
     * Joins a new Texas Holdem game using Web3
     */
    private static async joinGameWeb3(playerInfo: object, gameReadyCallback) {
        if (!window.ethereum) {
            console.error("Cannot connect to window.ethereum. Is Metamask or a similar plugin installed?");
            return;
        }

        // connect to ethereum
        await window.ethereum.request({ method: "eth_requestAccounts" });

        // retrieves provider + signer (e.g., from metamask)
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const playerAddress = await signer.getAddress();

        // connects to the TurnBasedGame and TurnBasedGameLobby contracts
        const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, signer);
        const gameContract = TurnBasedGame__factory.connect(TurnBasedGame.address, signer);
        const contextContract = TurnBasedGameContext__factory.connect(TurnBasedGameContext.address, signer);
        const lobbyContract = TurnBasedGameLobby__factory.connect(TurnBasedGameLobby.address, signer);
        const gameContextContract = contextContract.attach(gameContract.address);

        // cancels any current event listening
        gameContextContract.removeAllListeners();

        // listens to GameReady events indicating that a game has been created
        gameContextContract.on("GameReady", (index, ctx) => {
            // checks if player is participating in the newly created game
            const playerIndex = ctx.players.indexOf(playerAddress);
            if (playerIndex == -1) {
                // player is not participating in the game: ignore it
                return;
            }

            // copies relevant context data of the newly created game
            const context: any = {
                gameTemplateHash: ctx.gameTemplateHash,
                gameMetadata: ctx.gameMetadata,
                players: ctx.players,
                playerFunds: ctx.playerFunds,
                playerInfos: new Array(ctx.players.length),
                playerIndex: playerIndex,
                opponentIndex: playerIndex == 0 ? 1 : 0,
            };

            // decodes player infos
            for (let i = 0; i < ctx.players.length; i++) {
                context.playerInfos[i] = JSON.parse(ethers.utils.toUtf8String(ctx.playerInfos[i]));
            }

            // cancels event listening and calls callback
            gameContextContract.removeAllListeners();
            gameReadyCallback(index, context);
        });

        // retrieves player's balance to see how much he will bring to the table
        const playerFunds = await pokerTokenContract.balanceOf(playerAddress);

        // joins game by calling Lobby smart contract
        lobbyContract.joinGame(
            Lobby.TEXAS_HODLEM_TEMPLATE_HASH,
            Lobby.TEXAS_HODLEM_METADATA,
            Lobby.VALIDATORS_LOCALHOST,
            Lobby.NUM_PLAYERS,
            Lobby.MIN_FUNDS,
            PokerToken.address,
            playerFunds,
            ethers.utils.toUtf8Bytes(JSON.stringify(playerInfo))
        );
    }

    /**
     * Joins a new Texas Holdem game using a mock implementation
     */
    private static async joinGameMock(playerInfo: object, gameReadyCallback) {
        var gameIndex = 0;
        var opponentAvatar = Math.ceil(Math.random() * 6);
        var context = {
            gameTemplateHash: Lobby.TEXAS_HODLEM_TEMPLATE_HASH,
            gameMetadata: Lobby.TEXAS_HODLEM_METADATA,
            players: Lobby.VALIDATORS_LOCALHOST,
            playerFunds: [100, 100],
            playerInfos: [playerInfo, { name: "Sam", avatar: opponentAvatar }],
            playerIndex: 0,
            opponentIndex: 1,
        };
        setTimeout(() => gameReadyCallback(gameIndex, context), 6000);
    }
}
