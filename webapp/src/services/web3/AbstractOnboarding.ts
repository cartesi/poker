import { ethers } from "ethers";
import PokerToken from "../../abis/PokerToken.json";
import TurnBasedGame from "../../abis/TurnBasedGame.json";
import TurnBasedGameContext from "../../abis/TurnBasedGameContext.json";
import TurnBasedGameLobby from "../../abis/TurnBasedGameLobby.json";
import { PokerToken__factory } from "../../types";
import { TurnBasedGame__factory } from "../../types";
import { TurnBasedGameContext__factory } from "../../types";
import { GameConstants } from "../../GameConstants";
import { ServiceConfig } from "../ServiceConfig";
import { TurnBasedGameFactory } from "../TurnBasedGame";
import { GameVars } from "../../GameVars";

export class AbstractOnboarding {
    /**
     * Submits transaction to approve allowance for spending the user's tokens
     * @param onChange
     */
    protected static async approve(onChange) {
        // retrieves user address and contract
        const signer = ServiceConfig.getSigner();
        const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, signer);

        // for simplicity, at the moment we're requesting infinite approval
        await pokerTokenContract.approve(TurnBasedGameLobby.address, ethers.constants.MaxUint256);
        this.checkAllowance(onChange, true);
    }

    /**
     * Once an account is connected, checks if conditions are appropriate for starting the game.
     * @param onChange
     * @param chainName
     * @param updateCallback
     * @returns
     */
    protected static async checkAccountStatus(onChange, chainName, updateCallback) {
        onChange({
            label: "Checking account status...",
            onclick: undefined,
            loading: true,
            error: false,
            ready: false,
        });

        // checks if player has an unfinished ongoing game
        if (await this.checkUnfinishedGame(onChange, chainName, updateCallback)) {
            return;
        }

        // checks player's balance to see if he has enough tokens to play
        if (!(await this.checkBalance(onChange, chainName))) {
            return;
        }

        // checks player's allowance to see if the Lobby contract can manage the player's tokens
        if (!(await this.checkAllowance(onChange, false))) {
            return;
        }
    }

    private static claimTimeoutInterval;
    /**
     * Checks if the player has an ongoing unfinished game, and if true attempts to end it by timeout
     * @param onChange
     * @param chainName
     * @param updateCallback
     * @returns
     */
    protected static async checkUnfinishedGame(onChange, chainName, updateCallback): Promise<boolean> {
        // retrieves user address and contracts
        const signer = ServiceConfig.getSigner();
        const playerAddress = await signer.getAddress();
        const gameContract = TurnBasedGame__factory.connect(TurnBasedGame.address, signer);
        const contextContract = TurnBasedGameContext__factory.connect(TurnBasedGameContext.address, signer);
        const gameContextContract = contextContract.attach(gameContract.address);

        // checks locally stored game index
        if (GameVars.gameData.gameIndex) {
            // double-checks if corresponding game concerns the player
            const context = await gameContract.getContext(GameVars.gameData.gameIndex);
            if (context.players.includes(playerAddress)) {
                // there is a registered last game for the player, let's check it out
                const isRegisteredGameUnfinished = await this.checkUnfinishedGameByIndex(
                    onChange,
                    chainName,
                    updateCallback,
                    GameVars.gameData.gameIndex
                );
                if (isRegisteredGameUnfinished) {
                    // registered game is unfinished: stop here
                    return true;
                }
            }
        }

        // looks for a last game by fetching the latest turn submitted by the player (emits TurnOver event)
        const turnOverFilter = gameContextContract.filters.TurnOver(null, null, playerAddress, null);
        const turnOverEvents = await gameContextContract.queryFilter(turnOverFilter);
        if (turnOverEvents.length > 0) {
            const lastGameIndex = turnOverEvents[turnOverEvents.length - 1].args._index;
            if (await this.checkUnfinishedGameByIndex(onChange, chainName, updateCallback, lastGameIndex)) {
                // found an unfinished game, stop here
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if a specific game is unfinished, and if true attempts to end it by timeout
     * @param onChange
     * @param chainName
     * @param updateCallback
     * @param gameIndex
     * @returns
     */
    protected static async checkUnfinishedGameByIndex(
        onChange,
        chainName,
        updateCallback,
        gameIndex
    ): Promise<boolean> {
        // retrieves user address and contracts
        const signer = ServiceConfig.getSigner();
        const gameContract = TurnBasedGame__factory.connect(TurnBasedGame.address, signer);
        const contextContract = TurnBasedGameContext__factory.connect(TurnBasedGameContext.address, signer);
        const gameContextContract = contextContract.attach(gameContract.address);

        // checks if game is really over
        const gameOverFilter = gameContextContract.filters.GameOver(gameIndex, null);
        const gameOverEvents = await gameContextContract.queryFilter(gameOverFilter);
        if (gameOverEvents.length == 0) {
            // game is not over
            onChange({
                label: `You have an ongoing game on ${chainName}: attempting to end it by timeout`,
                onclick: undefined,
                loading: true,
                error: false,
                ready: false,
            });

            if (!AbstractOnboarding.claimTimeoutInterval) {
                // we are not already attempting to end an unfinished game by timeout: let's do it
                try {
                    // continuously attempts to end game by timeout
                    const turnBasedGame = TurnBasedGameFactory.create(gameIndex);
                    AbstractOnboarding.claimTimeoutInterval = setInterval(async () => {
                        await turnBasedGame.claimTimeout();
                    }, GameConstants.TIMEOUT_SECONDS * 1000);
                    await turnBasedGame.claimTimeout();

                    gameContract.on(gameOverFilter, () => {
                        // game is finally over: clear interval and update status
                        clearInterval(AbstractOnboarding.claimTimeoutInterval);
                        AbstractOnboarding.claimTimeoutInterval = undefined;
                        updateCallback(onChange);
                    });
                } catch (error) {
                    console.error(error);
                }
            }
            return true;
        }
        return false;
    }

    protected static async checkBalance(onChange, chainName): Promise<boolean> {
        // retrieves user address and contract
        const signer = ServiceConfig.getSigner();
        const playerAddress = await signer.getAddress();
        const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, signer);

        const playerFunds = await pokerTokenContract.balanceOf(playerAddress);
        if (playerFunds.lt(ethers.BigNumber.from(GameConstants.MIN_FUNDS))) {
            onChange({
                label: `Sorry, you need at least ${GameConstants.MIN_FUNDS} POKER tokens on ${chainName} to play`,
                onclick: undefined,
                loading: false,
                error: true,
                ready: false,
            });
            return false;
        }
        return true;
    }

    /**
     * Checks allowance for spending the user's tokens
     * - If not allowed, indicates approval is required
     * - If allowance is set, indicates user's available tokens and that he's ready to play
     * @param onChange
     * @param loading boolean indicating whether allowance approval has already been requested
     */
    protected static async checkAllowance(onChange, loading): Promise<boolean> {
        // retrieves user address and contract
        const signer = ServiceConfig.getSigner();
        const playerAddress = await signer.getAddress();
        const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, signer);

        const playerFunds = await pokerTokenContract.balanceOf(playerAddress);
        const allowance = await pokerTokenContract.allowance(playerAddress, TurnBasedGameLobby.address);
        const chainName = GameConstants.CHAIN_NAMES[ServiceConfig.getChainId()];

        if (playerFunds.lt(ethers.BigNumber.from(GameConstants.MIN_FUNDS))) {
            return false;
        }

        if (allowance.lt(playerFunds)) {
            // game is not allowed to use player's tokens
            if (loading) {
                // allowance approval has already been requested
                // - indicate process is underway
                onChange({
                    label: `Approving allowance...`,
                    onclick: undefined,
                    loading: true,
                    error: false,
                    ready: false,
                });
                // - schedule new allowance check
                setTimeout(() => {
                    this.checkAllowance(onChange, loading);
                }, 1000);
            } else {
                // indicate that allowance approval is required
                onChange({
                    label: `Approve allowance for POKER tokens on ${chainName}`,
                    onclick: this.approve.bind(this),
                    loading: false,
                    error: false,
                    ready: false,
                });
            }
            return false;
        } else {
            // game is allowed to use player's tokens
            // - indicate user's available tokens and that he's ready to play
            onChange({
                label: `You have ${playerFunds.toNumber()} POKER tokens available on ${chainName}`,
                onclick: undefined,
                loading: false,
                error: false,
                ready: true,
            });
            return true;
        }
    }
}
