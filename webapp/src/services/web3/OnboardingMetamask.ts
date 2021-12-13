import MetaMaskOnboarding from "@metamask/onboarding";
import { ethers } from "ethers";
import { GameConstants } from "../../GameConstants";
import { ServiceConfig } from "../ServiceConfig";
import { AbstractOnboardingWeb3 } from "./AbstractOnboardingWeb3";

declare let window: any;

export class OnboardingMetamask extends AbstractOnboardingWeb3 {
    private static metamask: any;
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

            this.metamask = window.ethereum;

            // attempts to retrieve connected account
            if (this.metamask.selectedAddress) {
                console.log(this.metamask.selectedAddress);
                this.accounts = await this.metamask.request({ method: "eth_requestAccounts" });
            }
            // sets up hooks to update web3 when accounts or chain change
            this.metamask.on("accountsChanged", (newAccounts) => {
                this.accounts = newAccounts;
                this.update(onChange);
            });
            this.metamask.on("chainChanged", () => {
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

            // we have a supported connected wallet: set application signer
            await this.setSigner();

            // checks player account's status
            super.checkAccountStatus(onChange, chainName, this.update.bind(this));
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
        if (!this.metamask) {
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
            this.accounts = await this.metamask.request({ method: "eth_requestAccounts" });
            this.update(onChange);
        }
    }

    /**
     * Sets signer for the application
     */
    private static async setSigner() {
        const web3Provider = new ethers.providers.Web3Provider(this.metamask);
        const signer = web3Provider.getSigner();
        ServiceConfig.setSigner(signer);
        console.log(`Connected to account '${await signer.getAddress()}' via Metamask`);
    }
}
