import { ethers } from "ethers";
import PokerToken from "../../abis/PokerToken.json";
import TurnBasedGameLobby from "../../abis/TurnBasedGameLobby.json";
import { PokerToken__factory } from "../../types";
import { GameConstants } from "../../GameConstants";
import { ServiceConfig } from "../ServiceConfig";


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

    protected static async checkBalance(onChange, loading, chainName) {
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
            return;
        }

    }

    /**
     * Checks allowance for spending the user's tokens
     * - If not allowed, indicates approval is required
     * - If allowance is set, indicates user's available tokens and that he's ready to play
     * @param onChange
     * @param loading boolean indicating whether allowance approval has already been requested
     */
    protected static async checkAllowance(onChange, loading) {
        const provider = new ethers.providers.Web3Provider(this.provider);
        const signer = provider.getSigner();
        const playerAddress = await signer.getAddress();
        const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, signer);
        const playerFunds = await pokerTokenContract.balanceOf(playerAddress);
        const allowance = await pokerTokenContract.allowance(playerAddress, TurnBasedGameLobby.address);
        const chainName = GameConstants.CHAIN_NAMES[ServiceConfig.getChainId()];

        if (playerFunds.lt(ethers.BigNumber.from(GameConstants.MIN_FUNDS))) return;

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
        }
    }
}