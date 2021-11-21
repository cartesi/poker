import Portis from "@portis/web3";
import { GameConstants } from "../../GameConstants";
import { ServiceConfig } from "../ServiceConfig";
import { ProviderType } from "./provider/Provider";
import { AbstractOnboarding } from "./AbstractOnboarding";

export class OnboardingPortis extends AbstractOnboarding {
    private static portis: Portis;
    private static isLogged;

    /**
     * Starts user onboarding using Web3
     */
    public static async start(onChange) {
        if (ServiceConfig.currentInstance.providerType != ProviderType.Portis) {
            throw new Error("A Portis web3 provider was not found!");
        }
        if (!ServiceConfig.currentInstance.provider) {
            throw new Error("No web3 provider was found!");
        }

        this.portis = ServiceConfig.currentInstance.provider.getRawProvider();
        super.setProvider(this.portis.provider);

        this.portis.isLoggedIn().then(({ error, result }) => {
            this.isLogged = result;
            this.update(onChange);
        });

        this.portis.onLogin(async (walletAddress, email, reputation) => {
            this.isLogged = true;
            ServiceConfig.currentInstance.setSigner(walletAddress);
            this.update(onChange);
        });

        this.portis.onActiveWalletChanged((walletAddress) => {
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
     * Connects to an Ethereum wallet
     * @param onChange
     */
    private static async connectWallet(onChange) {
        this.portis.showPortis().then(() => {
            this.update(onChange);
        });
    }
}
