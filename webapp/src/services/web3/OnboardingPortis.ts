import Portis from "@portis/web3";
import { GameConstants } from "../../GameConstants";
import { ServiceConfig } from "../ServiceConfig";
import { AbstractOnboardingWeb3 } from "./AbstractOnboardingWeb3";
import { ethers } from "ethers";

export class OnboardingPortis extends AbstractOnboardingWeb3 {
    private static portis: Portis;
    private static isLogged;

    /**
     * Starts user onboarding using Web3
     */
    public static async start(onChange, checkOnboardingActive) {
        if (!this.portis) {
            this.portis = new Portis(GameConstants.PROVIDER_PORTIS_APPID, {
                nodeUrl: ServiceConfig.getChainEndpoint(),
                chainId: ServiceConfig.getChainId(),
            });
        }

        this.portis.onLogin(async (walletAddress, email, reputation) => {
            this.setSigner(walletAddress);
            this.isLogged = true;
            this.update(onChange, checkOnboardingActive);
        });

        this.portis.onActiveWalletChanged((walletAddress) => {
            this.setSigner(walletAddress);
            this.update(onChange, checkOnboardingActive);
        });

        this.portis.showPortis().then(() => {
            this.update(onChange, checkOnboardingActive);
        });

        this.update(onChange, checkOnboardingActive);
    }

    /**
     * Main web3 update procedure
     */
    private static async update(onChange, checkOnboardingActive) {
        if (!checkOnboardingActive()) {
            // cancel update because onboarding is no longer active
            return;
        }
        try {
            // While Portis is initializing
            if (this.isLogged == undefined) {
                onChange({
                    label: "Connecting to wallet...",
                    onclick: undefined,
                    loading: true,
                    error: false,
                    ready: false,
                });
                return;
            }

            // Portis initialized but user is not logged in
            if (this.isLogged == false) {
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

            // checks player account's status
            super.checkAccountStatus(onChange, () => {
                this.update(onChange, checkOnboardingActive);
            });
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
    private static async connectWallet(onChange, checkOnboardingActive) {
        this.portis.showPortis().then(() => {
            this.update(onChange, checkOnboardingActive);
        });
    }

    /**
     * Sets signer for the application
     */
    private static setSigner(address: string) {
        const web3Provider = new ethers.providers.Web3Provider(this.portis.provider);
        const signer = web3Provider.getSigner(address);
        ServiceConfig.setSigner(signer);
        console.log(`Connected to account '${address}' via Portis`);
    }
}
