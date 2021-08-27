import { ethers } from "ethers";
import MetaMaskOnboarding from "@metamask/onboarding";
import PokerToken from "../../abis/PokerToken.json";
import TurnBasedGameLobby from "../../abis/TurnBasedGameLobby.json";
import { PokerToken__factory } from "../../types";
import { GameConstants } from "../../GameConstants";
import { ServiceConfig } from "../ServiceConfig";
import { AbstractOnboarding } from "./AbstractOnboarding";

declare let window: any;

export class OnboardingMetamask extends AbstractOnboarding {
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

            ServiceConfig.currentInstance.setChain(window.ethereum.chainId);
            super.setProvider(window.ethereum);

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
            const chainName = GameConstants.CHAIN_NAMES[ServiceConfig.getChainId()];
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
            super.checkBalance(onChange, false, chainName);

            // checks player's allowance to see if the Lobby contract can manage the player's tokens
            super.checkAllowance(onChange, false);
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
}