import { ethers } from "ethers";
import PokerTokenJson from "../../abis/PokerToken.json";
import TurnBasedGame from "../../abis/TurnBasedGame.json";
import TurnBasedGameContext from "../../abis/TurnBasedGameContext.json";
import TurnBasedGameLobby from "../../abis/TurnBasedGameLobby.json";
import { PokerToken, PokerToken__factory } from "../../types";
import { TurnBasedGame__factory } from "../../types";
import { TurnBasedGameContext__factory } from "../../types";
import { GameConstants } from "../../GameConstants";
import { ServiceConfig } from "../ServiceConfig";
import { TurnBasedGameFactory } from "../TurnBasedGame";
import { GameVars } from "../../GameVars";
import { Lobby } from "../Lobby";
import { ErrorHandler } from "../ErrorHandler";
import { Wallet } from "../Wallet";

export class AbstractOnboardingWeb3 {
    private static claimTimeoutInterval;
    private static pokerTokenContractWithListeners: PokerToken;

    /**
     * Once an account is connected, checks if conditions are appropriate for starting the game.
     * @param onChange
     * @param chainName
     * @param updateCallback
     * @returns
     */
    protected static async checkAccountStatus(onChange, updateCallback) {
        onChange({
            label: "Checking account status...",
            onclick: undefined,
            loading: true,
            error: false,
            ready: false,
        });

        // sets up a listener to refresh the wallet when appropriate
        this.setupWalletTransferListeners(onChange, updateCallback);

        // checks if player is already enqueued in the lobby
        if (await this.checkEnqueuedInLobby(onChange)) {
            return;
        }

        // checks if player has an unfinished ongoing game
        if (await this.checkUnfinishedGame(onChange, updateCallback)) {
            return;
        }

        // checks player's balance to see if he has enough tokens to play
        if (!(await this.checkBalance(onChange))) {
            return;
        }

        // checks player's allowance to see if the Lobby contract can manage the player's tokens
        if (!(await this.checkAllowance(onChange, false))) {
            return;
        }
    }

    /**
     * Sets up listeners to ensure wallet is updated if its POKER balance changes
     * @param onChange
     * @param updateCallback
     */
    protected static async setupWalletTransferListeners(onChange, updateCallback) {
        // defines callback to execute when balance changes
        const callback = function (event) {
            updateCallback(onChange);
        };

        // clears up existing transfer listeners
        if (this.pokerTokenContractWithListeners) {
            this.pokerTokenContractWithListeners.removeAllListeners();
        }

        // retrieves user address and poker token contract
        const signer = ServiceConfig.getSigner();
        const signerAddress = await signer.getAddress();
        this.pokerTokenContractWithListeners = PokerToken__factory.connect(PokerTokenJson.address, signer);

        // sets up new transfer listeners
        const transferToFilter = this.pokerTokenContractWithListeners.filters.Transfer(null, signerAddress, null);
        const transferFromFilter = this.pokerTokenContractWithListeners.filters.Transfer(signerAddress, null, null);
        this.pokerTokenContractWithListeners.once(transferToFilter, callback);
        this.pokerTokenContractWithListeners.once(transferFromFilter, callback);
    }

    /**
     * Checks if the player is already enqueued in the Lobby
     * @param onChange
     * @returns
     */
    protected static async checkEnqueuedInLobby(onChange): Promise<boolean> {
        if (await Lobby.isEnqueued()) {
            onChange({
                label: `Canceling previous request to join a game...`,
                onclick: undefined,
                loading: true,
                error: false,
                ready: false,
            });
            Lobby.leaveQueue();
            return true;
        } else {
            return false;
        }
    }

    /**
     * Checks if the player has an ongoing unfinished game, and if true attempts to end it by timeout
     * @param onChange
     * @param chainName
     * @param updateCallback
     * @returns
     */
    protected static async checkUnfinishedGame(onChange, updateCallback): Promise<boolean> {
        // retrieves user address and contracts
        const signer = ServiceConfig.getSigner();
        const playerAddress = await signer.getAddress();
        const gameContract = TurnBasedGame__factory.connect(TurnBasedGame.address, signer);
        const contextContract = TurnBasedGameContext__factory.connect(TurnBasedGameContext.address, signer);
        const gameContextContract = contextContract.attach(gameContract.address);

        // checks locally stored game index
        if (GameVars.gameData.gameIndex) {
            // double-checks if corresponding game concerns the player
            try {
                const context = await gameContract.getContext(GameVars.gameData.gameIndex);
                if (context.players.includes(playerAddress)) {
                    // there is a registered last game for the player, let's check it out
                    const isRegisteredGameUnfinished = await this.checkUnfinishedGameByIndex(
                        onChange,
                        updateCallback,
                        GameVars.gameData.gameIndex
                    );
                    if (isRegisteredGameUnfinished) {
                        // registered game is unfinished: stop here
                        return true;
                    }
                }
            } catch (error) {
                // error retrieving current game: maybe contract has changed, log it and ignore
                console.error(
                    `Failed to retrieve current game from locally stored index ${GameVars.gameData.gameIndex}: ${error}`
                );
            }
        }

        // looks for a last game by fetching the latest turn submitted by the player (emits TurnOver event)
        const turnOverFilter = gameContextContract.filters.TurnOver(null, null, playerAddress, null);
        let turnOverEvents;
        await ErrorHandler.execute("queryTurnOver", async () => {
            turnOverEvents = await gameContextContract.queryFilter(turnOverFilter);
        });
        if (turnOverEvents.length > 0) {
            const lastGameIndex = turnOverEvents[turnOverEvents.length - 1].args._index;
            if (await this.checkUnfinishedGameByIndex(onChange, updateCallback, lastGameIndex)) {
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
    protected static async checkUnfinishedGameByIndex(onChange, updateCallback, gameIndex): Promise<boolean> {
        // retrieves user address and contracts
        const signer = ServiceConfig.getSigner();
        const gameContract = TurnBasedGame__factory.connect(TurnBasedGame.address, signer);
        const contextContract = TurnBasedGameContext__factory.connect(TurnBasedGameContext.address, signer);
        const gameContextContract = contextContract.attach(gameContract.address);

        // checks if game is really over
        const gameOverFilter = gameContextContract.filters.GameOver(gameIndex, null);
        let gameOverEvents;
        await ErrorHandler.execute("queryGameOver", async () => {
            gameOverEvents = await gameContextContract.queryFilter(gameOverFilter);
        });
        if (gameOverEvents.length == 0) {
            // game is not over
            onChange({
                label: `You have an ongoing game: please wait until it is ended by timeout`,
                onclick: undefined,
                loading: true,
                error: false,
                ready: false,
            });

            if (!AbstractOnboardingWeb3.claimTimeoutInterval) {
                // we are not already attempting to end an unfinished game by timeout: let's do it
                try {
                    // continuously attempts to end game by timeout
                    const turnBasedGame = TurnBasedGameFactory.create(gameIndex);
                    AbstractOnboardingWeb3.claimTimeoutInterval = setInterval(async () => {
                        await turnBasedGame.claimTimeout();
                    }, GameConstants.TIMEOUT_SECONDS * 1000);
                    await turnBasedGame.claimTimeout();

                    gameContract.on(gameOverFilter, () => {
                        // game is finally over: clear interval and update status
                        clearInterval(AbstractOnboardingWeb3.claimTimeoutInterval);
                        AbstractOnboardingWeb3.claimTimeoutInterval = undefined;
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

    protected static async checkBalance(onChange): Promise<boolean> {
        // retrieves user address and contract
        const chainName = GameConstants.CHAIN_NAMES[ServiceConfig.getChainId()];

        // checks balance in POKER tokens
        const tokenBalance = await Wallet.getPokerTokens();
        if (tokenBalance.lt(ethers.BigNumber.from(GameConstants.MIN_FUNDS))) {
            onChange({
                label: `Sorry, you need at least ${GameConstants.MIN_FUNDS} POKER tokens on ${chainName} to play`,
                onclick: undefined,
                loading: false,
                error: true,
                ready: false,
            });
            return false;
        }
        // checks balance in network funds (ETH/MATIC)
        const balance = await Wallet.getBalance();
        const chainCurrency = GameConstants.CHAIN_CURRENCIES[ServiceConfig.getChainId()];
        if (balance.eq(ethers.constants.Zero)) {
            onChange({
                label: `Sorry, you need some ${chainCurrency} on ${chainName} to play`,
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
        const playerFunds = await Wallet.getPokerTokens();
        if (playerFunds.lt(ethers.BigNumber.from(GameConstants.MIN_FUNDS))) {
            return false;
        }

        // retrieves user address and contract
        const signer = ServiceConfig.getSigner();
        const playerAddress = await signer.getAddress();
        const pokerTokenContract = PokerToken__factory.connect(PokerTokenJson.address, signer);

        // retrieves allowance
        let allowance;
        await ErrorHandler.execute("allowance", async () => {
            allowance = await pokerTokenContract.allowance(playerAddress, TurnBasedGameLobby.address);
        });

        if (allowance.lt(playerFunds)) {
            // game is not allowed to use player's tokens
            if (loading) {
                // allowance approval has already been requested
                // - indicate process is underway
                onChange({
                    label: `Waiting for approval...`,
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
                    label: `Approve allowance for POKER tokens`,
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
                label: `You have ${playerFunds.toNumber()} POKER tokens available to play`,
                onclick: undefined,
                loading: false,
                error: false,
                ready: true,
            });
            return true;
        }
    }

    /**
     * Submits transaction to approve allowance for spending the user's tokens
     * @param onChange
     */
    protected static async approve(onChange) {
        onChange({
            label: `Sending approval request...`,
            onclick: undefined,
            loading: true,
            error: false,
            ready: false,
        });

        // retrieves user address and contract
        const signer = ServiceConfig.getSigner();
        const pokerTokenContract = PokerToken__factory.connect(PokerTokenJson.address, signer);

        // sends approve request: for simplicity, at the moment we're requesting infinite approval
        await ErrorHandler.execute("approve", async () => {
            const tx = await pokerTokenContract.approve(TurnBasedGameLobby.address, ethers.constants.MaxUint256);
            console.log(`Submitted approve request (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})`);
        });
        this.checkAllowance(onChange, true);
    }
}
