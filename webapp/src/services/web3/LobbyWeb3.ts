import { ethers } from "ethers";
import TurnBasedGameJson from "../../abis/TurnBasedGame.json";
import TurnBasedGameContextJson from "../../abis/TurnBasedGameContext.json";
import TurnBasedGameLobbyJson from "../../abis/TurnBasedGameLobby.json";
import PokerToken from "../../abis/PokerToken.json";
import { TurnBasedGameContext, TurnBasedGame__factory } from "../../types";
import { TurnBasedGameContext__factory } from "../../types";
import { TurnBasedGameLobby__factory } from "../../types";
import { PokerToken__factory } from "../../types";
import { GameConstants } from "../../GameConstants";
import { ServiceConfig } from "../ServiceConfig";
import { Web3Utils } from "./Web3Utils";
import { ErrorHandler } from "../ErrorHandler";

export class LobbyWeb3 {
    private gameContextContract: TurnBasedGameContext;

    /**
     * Retrieves singleton instance
     */
    private static instance: LobbyWeb3;
    public static getInstance(): LobbyWeb3 {
        if (!this.instance) {
            this.instance = new LobbyWeb3();
        }
        return this.instance;
    }

    /**
     * Joins a new Texas Holdem game using Web3
     *
     * @param playerFunds funds being brought to the game
     * @param playerInfo JSON object with descriptive information (name, avatar) about the player joining
     * @param gameReadyCallback callback to be called once game is ready to start, receiving two arguments: the new game's index and its full context (players involved, etc)
     */
    public async joinGame(playerInfo: Object, gameReadyCallback) {
        // retrieves signer + chainId (e.g., from metamask)
        const signer = ServiceConfig.getSigner();
        const chainId = ServiceConfig.getChainId();

        const playerAddress = await signer.getAddress();

        // cancels any current event listening
        if (this.gameContextContract) {
            this.gameContextContract.removeAllListeners();
        }

        // connects to the TurnBasedGame, TurnBasedGameLobby and PokerToken contracts
        const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, signer);
        const gameContract = TurnBasedGame__factory.connect(TurnBasedGameJson.address, signer);
        const contextContract = TurnBasedGameContext__factory.connect(TurnBasedGameContextJson.address, signer);
        const lobbyContract = TurnBasedGameLobby__factory.connect(TurnBasedGameLobbyJson.address, signer);
        this.gameContextContract = contextContract.attach(gameContract.address);

        // listens to GameReady events indicating that a game has been created
        this.gameContextContract.on("GameReady", (index, ctx) => {
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
            this.gameContextContract.removeAllListeners();
            gameReadyCallback(index, context);
        });

        // joins game if player is not already enqueued
        if (!(await this.isEnqueued())) {
            // retrieves player's balance to see how much he will bring to the table
            const playerFunds = await pokerTokenContract.balanceOf(playerAddress);

            // retrieves validator addresses for the selected chain
            const validators = GameConstants.VALIDATORS[chainId];
            if (!validators || !validators.length) {
                console.error("No validators defined for the selected chain with ID " + chainId);
            }

            // Encode player infos
            let encodedPlayerInfo = Web3Utils.toUint8Array(playerInfo);

            // joins game by calling Lobby smart contract
            await ErrorHandler.execute("joinGame", async () => {
                const tx = await lobbyContract.joinGame(
                    GameConstants.GAME_TEMPLATE_HASH,
                    GameConstants.GAME_METADATA,
                    validators,
                    GameConstants.TIMEOUT_SECONDS,
                    GameConstants.NUM_PLAYERS,
                    GameConstants.MIN_FUNDS,
                    PokerToken.address,
                    playerFunds,
                    encodedPlayerInfo
                );
                await tx.wait();
                console.log(`Submitted join game request (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})`);
            });
        }
    }

    /**
     * Leaves Texas Holdem game queue
     */
    public async leaveQueue(): Promise<void> {
        // connects to TurnBasedGameLobby contract
        const signer = ServiceConfig.getSigner();
        const lobbyContract = TurnBasedGameLobby__factory.connect(TurnBasedGameLobbyJson.address, signer);

        // retrieves validator addresses for the selected chain
        const chainId = ServiceConfig.getChainId();
        const validators = GameConstants.VALIDATORS[chainId];
        if (!validators || !validators.length) {
            console.error("No validators defined for the selected chain with ID " + chainId);
        }

        // leaves queue by calling Lobby smart contract
        await ErrorHandler.execute("leaveQueue", async () => {
            const tx = await lobbyContract.leaveQueue(
                GameConstants.GAME_TEMPLATE_HASH,
                GameConstants.GAME_METADATA,
                validators,
                GameConstants.TIMEOUT_SECONDS,
                GameConstants.NUM_PLAYERS,
                GameConstants.MIN_FUNDS,
                PokerToken.address
            );
            await tx.wait();
            console.log(`Submitted leave queue request (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})`);
        });

        // cancels any game event listening
        if (this.gameContextContract) {
            this.gameContextContract.removeAllListeners();
        }
    }

    /*
     * Checks if player is already enqueued waiting for another player to join a new Texas Holdem game
     */
    public async isEnqueued(): Promise<boolean> {
        // connects to TurnBasedGameLobby contract
        const signer = ServiceConfig.getSigner();
        const playerAddress = await signer.getAddress();
        const lobbyContract = TurnBasedGameLobby__factory.connect(TurnBasedGameLobbyJson.address, signer);

        // retrieves validator addresses for the selected chain
        const chainId = ServiceConfig.getChainId();
        const validators = GameConstants.VALIDATORS[chainId];
        if (!validators || !validators.length) {
            console.error("No validators defined for the selected chain with ID " + chainId);
        }

        // retrieves current queue in the Lobby smart contract
        let queuedPlayers;
        await ErrorHandler.execute("getQueue", async () => {
            queuedPlayers = await lobbyContract.getQueue(
                GameConstants.GAME_TEMPLATE_HASH,
                GameConstants.GAME_METADATA,
                validators,
                GameConstants.TIMEOUT_SECONDS,
                GameConstants.NUM_PLAYERS,
                GameConstants.MIN_FUNDS,
                PokerToken.address
            );
        });

        // checks if player is enqueued
        for (let queuedPlayer of queuedPlayers) {
            if (queuedPlayer.addr == playerAddress) {
                return true;
            }
        }
        return false;
    }
}
