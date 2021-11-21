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

export class AbstractOnboarding {
    private static provider;

    protected static setProvider(provider: any) {
        this.provider = provider;
    }

    /**
     * Submits transaction to approve allowance for spending the user's tokens
     * @param onChange
     */
    protected static async approve(onChange) {
        const provider = new ethers.providers.Web3Provider(this.provider);
        const signer = provider.getSigner();
        const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, signer);
        // for simplicity, at the moment we're requesting infinite approval
        await pokerTokenContract.approve(TurnBasedGameLobby.address, ethers.constants.MaxUint256);
        this.checkAllowance(onChange, true);
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
        if (AbstractOnboarding.claimTimeoutInterval) {
            // we are already attempting to end an unfinished game by timeout
            onChange({
                label: `You have an ongoing game on ${chainName}: attempting to end it by timeout`,
                onclick: undefined,
                loading: true,
                error: false,
                ready: false,
            });
            return true;
        }
        const web3Provider = new ethers.providers.Web3Provider(this.provider);
        const signer = web3Provider.getSigner();
        const playerAddress = await signer.getAddress();

        const gameContract = TurnBasedGame__factory.connect(TurnBasedGame.address, signer);
        const contextContract = TurnBasedGameContext__factory.connect(TurnBasedGameContext.address, signer);
        const gameContextContract = contextContract.attach(gameContract.address);

        // fetch latest turn submitted by the player (emits TurnOver event)
        const turnOverFilter = gameContextContract.filters.TurnOver(null, null, playerAddress, null);
        const turnOverEvents = await gameContextContract.queryFilter(turnOverFilter);
        if (turnOverEvents.length > 0) {
            const lastGameIndex = turnOverEvents[turnOverEvents.length - 1].args._index;
            const gameOverFilter = gameContextContract.filters.GameOver(lastGameIndex, null);
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

                try {
                    // continuously attempts to end game by timeout
                    const turnBasedGame = TurnBasedGameFactory.create(lastGameIndex);
                    await turnBasedGame.claimTimeout();
                    AbstractOnboarding.claimTimeoutInterval = setInterval(async () => {
                        await turnBasedGame.claimTimeout();
                    }, GameConstants.TIMEOUT_SECONDS * 1000);

                    gameContract.on(gameOverFilter, () => {
                        // game is finally over: clear interval and update status
                        clearInterval(AbstractOnboarding.claimTimeoutInterval);
                        AbstractOnboarding.claimTimeoutInterval = undefined;
                        updateCallback(onChange);
                    });
                    return true;
                } catch (error) {
                    console.error(error);
                }
            }
        }
        return false;
    }

    protected static async checkBalance(onChange, chainName): Promise<boolean> {
        const web3Provider = new ethers.providers.Web3Provider(this.provider);
        const signer = web3Provider.getSigner();
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
        const provider = new ethers.providers.Web3Provider(this.provider);
        const signer = provider.getSigner();
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
