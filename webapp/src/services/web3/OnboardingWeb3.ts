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
                console.error("Cannot connect to window.ethereum, even though Metamask should be installed!");
                return;
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
            if (!MetaMaskOnboarding.isMetaMaskInstalled()) {
                onChange({
                    label: "Install MetaMask",
                    onclick: this.installMetaMask.bind(this),
                    error: false,
                    ready: false,
                });
                return;
            }
            if (!this.accounts || !this.accounts.length) {
                onChange({
                    label: "Connect to wallet",
                    onclick: this.connectMetaMask.bind(this),
                    error: false,
                    ready: false,
                });
                return;
            }
            this.metamaskOnboarding.stopOnboarding();
            const chainName = GameConstants.CHAINS[window.ethereum.chainId];
            if (!chainName) {
                onChange({
                    label: "Unsupported network",
                    onclick: this.connectMetaMask.bind(this),
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
                error: true,
                ready: false,
            });
        }
    }

    private static installMetaMask(onChange) {
        this.metamaskOnboarding.startOnboarding();
        onChange({ label: "Onboarding in progress", onclick: undefined, error: false, ready: false });
    }

    private static async connectMetaMask(onChange) {
        if (!window.ethereum) {
            // ethereum not available
            onChange({
                label: "Cannot connect to window.ethereum, even though Metamask should be installed!",
                onclick: undefined,
                error: true,
                ready: false,
            });
        } else {
            // connect to ethereum
            this.accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            this.update(onChange);
        }
    }

    private static async approve(onChange) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, signer);
        await pokerTokenContract.approve(TurnBasedGameLobby.address, ethers.constants.MaxUint256);
        this.checkAllowance(onChange, true);
    }

    private static async checkAllowance(onChange, loading) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const playerAddress = await signer.getAddress();
        const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, signer);
        const playerFunds = await pokerTokenContract.balanceOf(playerAddress);
        const allowance = await pokerTokenContract.allowance(playerAddress, TurnBasedGameLobby.address);
        const chainName = GameConstants.CHAINS[window.ethereum.chainId];
        if (allowance.lt(playerFunds)) {
            onChange({
                label: `Approve allowance for POKER tokens on ${chainName}`,
                onclick: this.approve.bind(this),
                error: false,
                ready: false,
            });
            if (loading) {
                setTimeout(() => {
                    this.checkAllowance(onChange, loading);
                }, 1000);
            }
        } else {
            onChange({
                label: `You have ${playerFunds.toNumber()} POKER tokens available on ${chainName}`,
                onclick: this.connectMetaMask.bind(this),
                error: false,
                ready: true,
            });
        }
    }
}
