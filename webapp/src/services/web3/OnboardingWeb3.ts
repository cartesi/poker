import { ethers } from "ethers";
import MetaMaskOnboarding from "@metamask/onboarding";
import PokerToken from "../../abis/PokerToken.json";
import TurnBasedGameLobby from "../../abis/TurnBasedGameLobby.json";
import { PokerToken__factory } from "../../types";
import { GameConstants } from "../../GameConstants";

declare let window: any;

export class OnboardingWeb3 {
    private static metamaskOnboarding;
    private static accounts;

    /**
     * Starts user onboarding using Web3
     */
    public static async start(onChange) {
        if (!this.metamaskOnboarding) {
            this.metamaskOnboarding = new MetaMaskOnboarding();
        }
        if (MetaMaskOnboarding.isMetaMaskInstalled()) {
            if (!window.ethereum) {
                throw "Cannot connect to window.ethereum. Is Metamask or a similar plugin installed?";
            }
            // attempts to retrieve connected account
            if (window.ethereum.selectedAddress) {
                this.accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            }
            // sets up hooks to update web3 when accounts or chain change
            window.ethereum.on("accountsChanged", (newAccounts) => {
                this.accounts = newAccounts;
                this.update(onChange);
            });
            window.ethereum.on("chainChanged", () => {
                this.update(onChange);
            });
        }
        this.update(onChange);
    }

    /**
     * Main web3 update procedure
     */
    private static async update(onChange) {
        try {
            // checks if metamask is installed
            if (!MetaMaskOnboarding.isMetaMaskInstalled()) {
                onChange({
                    label: "Install MetaMask",
                    onclick: this.installMetaMask.bind(this),
                    loading: false,
                    error: false,
                    ready: false,
                });
                return;
            }
            // checks if a wallet is connected
            if (!this.accounts || !this.accounts.length) {
                onChange({
                    label: "Connect to wallet",
                    onclick: this.connectWallet.bind(this),
                    loading: false,
                    error: false,
                    ready: false,
                });
                return;
            }
            this.metamaskOnboarding.stopOnboarding();

            // checks if the connected wallet's network is known/supported
            const chainName = GameConstants.CHAINS[window.ethereum.chainId];
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
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
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
     * Starts MetaMask installation process
     * @param onChange
     */
    private static installMetaMask(onChange) {
        this.metamaskOnboarding.startOnboarding();
        onChange({
            label: "Waiting for MetaMask installation...",
            onclick: undefined,
            loading: true,
            error: false,
            ready: false,
        });
    }

    /**
     * Connects to an Ethereum wallet
     * @param onChange
     */
    private static async connectWallet(onChange) {
        if (!window.ethereum) {
            // ethereum not available
            onChange({
                label: "Cannot connect to window.ethereum, even though Metamask should be installed!",
                onclick: undefined,
                loading: false,
                error: true,
                ready: false,
            });
        } else {
            // connects to ethereum wallet
            this.accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            this.update(onChange);
        }
    }

    /**
     * Submits transaction to approve allowance for spending the user's tokens
     * @param onChange
     */
    private static async approve(onChange) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
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
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const playerAddress = await signer.getAddress();
        const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, signer);
        const playerFunds = await pokerTokenContract.balanceOf(playerAddress);
        const allowance = await pokerTokenContract.allowance(playerAddress, TurnBasedGameLobby.address);
        const chainName = GameConstants.CHAINS[window.ethereum.chainId];

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
