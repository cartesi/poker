import { ethers } from "ethers";
import Portis from "@portis/web3";
import PokerToken from "../../abis/PokerToken.json";
import TurnBasedGameLobby from "../../abis/TurnBasedGameLobby.json";
import { PokerToken__factory } from "../../types";
import { GameConstants } from "../../GameConstants";
import { ServiceConfig } from "../ServiceConfig";
import { ProviderImpl } from "./provider/Provider";

export class OnboardingPortis {
    private static portis: Portis;
    private static accounts;
    private static isLogged;

    /**
     * Starts user onboarding using Web3
     */
    public static async start(onChange) {
        if (ServiceConfig.currentInstance.providerType != ProviderImpl.Portis) {
            throw new Error("A Portis web3 provider was not found!");
        }
        if (!ServiceConfig.currentInstance.provider) {
            throw new Error("No web3 provider was found!");
        }

        this.portis = ServiceConfig.currentInstance.provider.getRawProvider();

        this.portis.isLoggedIn()
            .then(({ error, result }) => {
                this.isLogged = result;
            });

        this.portis.onLogin(async (walletAddress, email, reputation) => {
            this.isLogged = true;
            const web3Provider = new ethers.providers.Web3Provider(this.portis.provider);
            this.accounts = await web3Provider.listAccounts();
        });

        this.portis.onActiveWalletChanged(walletAddress => {
            console.log(walletAddress);
            ServiceConfig.currentInstance.setSigner(walletAddress);
            this.update(onChange);
        });

        this.portis.showPortis().then(() => {
            this.update(onChange);
        });

        this.update(onChange);
    }

    /**
     * Main web3 update procedure
     */
    private static async update(onChange) {

        try {
            // While Portis is initializing
            if (this.isLogged == null || this.isLogged == undefined) {
                onChange({
                    label: "Connecting to wallet...",
                    onclick: undefined,
                    loading: false,
                    error: false,
                    ready: false,
                });
                return;
            }

            // Portis initialized but user is not logged in
            if (!this.isLogged || !this.accounts || !this.accounts.length) {
                onChange({
                    label: "Connect to wallet",
                    onclick: this.connectWallet.bind(this),
                    loading: false,
                    error: false,
                    ready: false,
                });
                return;
            }

            // checks if the connected wallet's network is known/supported
            // TODO Remove hardcoded value
            const chainName = GameConstants.CHAINS['0x13881'];
            if (!chainName) {
                onChange({
                    label: "Unsupported network",
                    onclick: this.connectWallet.bind(this),
                    loading: false,
                    error: true,
                    ready: false,
                });
                return;
            }

            // checks player's balance to see if he has enough tokens to play
            const web3Provider = new ethers.providers.Web3Provider(this.portis.provider);
            const signer = web3Provider.getSigner();
            const playerAddress = await signer.getAddress();

            const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, signer);
            const playerFunds = await pokerTokenContract.balanceOf(playerAddress);
            if (playerFunds < ethers.BigNumber.from(GameConstants.MIN_FUNDS)) {
                onChange({
                    label: `Sorry, you need at least ${GameConstants.MIN_FUNDS} POKER tokens on ${chainName} to play`,
                    onclick: undefined,
                    loading: false,
                    error: true,
                    ready: false,
                });
                return;
            }

            // checks player's allowance to see if the Lobby contract can manage the player's tokens
            this.checkAllowance(onChange, false);
        } catch (error) {
            console.error(error);
            onChange({
                label: "Unexpected error",
                onclick: undefined,
                loading: false,
                error: true,
                ready: false,
            });
        }
    }

    /**
     * Connects to an Ethereum wallet
     * @param onChange
     */
    private static async connectWallet(onChange) {
        this.portis.showPortis().then(() => {
            this.update(onChange);
        });
    }

    /**
     * Submits transaction to approve allowance for spending the user's tokens
     * @param onChange
     */
    private static async approve(onChange) {
        const provider = new ethers.providers.Web3Provider(this.portis.provider);
        const signer = provider.getSigner();
        const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, signer);
        // for simplicity, at the moment we're requesting infinite approval
        await pokerTokenContract.approve(TurnBasedGameLobby.address, ethers.constants.MaxUint256);
        this.checkAllowance(onChange, true);
    }

    /**
     * Checks allowance for spending the user's tokens
     * - If not allowed, indicates approval is required
     * - If allowance is set, indicates user's available tokens and that he's ready to play
     * @param onChange
     * @param loading boolean indicating whether allowance approval has already been requested
     */
    private static async checkAllowance(onChange, loading) {
        const provider = new ethers.providers.Web3Provider(this.portis.provider);
        const signer = provider.getSigner();
        const playerAddress = await signer.getAddress();
        const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, signer);
        const playerFunds = await pokerTokenContract.balanceOf(playerAddress);
        const allowance = await pokerTokenContract.allowance(playerAddress, TurnBasedGameLobby.address);
        const chainName = GameConstants.CHAINS['0x13881']; // TODO Remove Hardcoded

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