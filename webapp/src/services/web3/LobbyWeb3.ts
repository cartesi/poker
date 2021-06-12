import { Lobby } from "../Lobby";
import { ethers } from "ethers";
import TurnBasedGame from "../../abis/TurnBasedGame.json";
import TurnBasedGameContext from "../../abis/TurnBasedGameContext.json";
import TurnBasedGameLobby from "../../abis/TurnBasedGameLobby.json";
import PokerToken from "../../abis/PokerToken.json";
import { TurnBasedGame__factory } from "../../types";
import { TurnBasedGameContext__factory } from "../../types";
import { TurnBasedGameLobby__factory } from "../../types";
import { PokerToken__factory } from "../../types";

declare let window: any;
export class LobbyWeb3 {
    /**
     * Joins a new Texas Holdem game using Web3
     */
    public static async joinGame(playerInfo: object, gameReadyCallback) {
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
}
