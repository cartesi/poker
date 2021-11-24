import { GameConstants } from "../../GameConstants";
import { ServiceConfig } from "../ServiceConfig";
import { ProviderType } from "./provider/Provider";
import { AbstractOnboarding } from "./AbstractOnboarding";
import { ethers } from "ethers";
import { GameVars } from "../../GameVars";
import { GameManager } from "../../GameManager";

export class OnboardingInternalWallet extends AbstractOnboarding {
    private static wallet: ethers.Wallet;
    private static password = "53H#YwnPc!#2";

    /**
     * Starts user onboarding using Web3
     */
    public static async start(onChange) {
        if (ServiceConfig.currentInstance.providerType != ProviderType.JsonRpc) {
            throw new Error("A JSON-RPC web3 provider was not found!");
        }
        if (!ServiceConfig.currentInstance.provider) {
            throw new Error("No web3 provider was found!");
        }

        ServiceConfig.currentInstance.setChain(GameConstants.DEFAULT_CHAIN);

        this.update(onChange);
    }

    /**
     * Main web3 update procedure
     */
    private static async update(onChange) {
        try {
            if (this.wallet == undefined) {
                // wallet not initialized
                OnboardingInternalWallet.connectWallet(onChange);
                onChange({
                    label: "Connecting to wallet...",
                    onclick: undefined,
                    loading: true,
                    error: false,
                    ready: false,
                });
                return;
            }

            // checks if player has an unfinished ongoing game
            const chainName = GameConstants.CHAIN_NAMES[ServiceConfig.getChainId()];
            if (await super.checkUnfinishedGame(onChange, chainName, this.update.bind(this))) {
                return;
            }

            // checks player's balance to see if he has enough tokens to play
            if (!(await super.checkBalance(onChange, chainName))) {
                return;
            }

            // checks player's allowance to see if the Lobby contract can manage the player's tokens
            if (!(await super.checkAllowance(onChange, false))) {
                return;
            }
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
        // TODO: ask user for password
        const password = OnboardingInternalWallet.password;

        if (!GameVars.gameData.walletEncryptedJson) {
            // no wallet stored locally: creates a new wallet and saves corresponding encrypted JSON to local storage
            console.log(`Creating new internal wallet..`);
            OnboardingInternalWallet.wallet = ethers.Wallet.createRandom();
            GameVars.gameData.walletEncryptedJson = await OnboardingInternalWallet.wallet.encrypt(password);
            GameManager.writeGameData();
        } else {
            // decrypts previously stored encrypted wallet JSON
            OnboardingInternalWallet.wallet = await ethers.Wallet.fromEncryptedJson(
                GameVars.gameData.walletEncryptedJson,
                password
            );
        }

        // sets wallet address as signer
        const walletAddress = await OnboardingInternalWallet.wallet.getAddress();
        ServiceConfig.currentInstance.setSigner(walletAddress);

        console.log(`Connected to internal wallet ${walletAddress}`);

        this.update(onChange);
    }
}
