import { ethers } from "ethers";
import MetaMaskOnboarding from "@metamask/onboarding";

declare let window: any;

export class Onboarding {

    private static metamaskOnboarding;
    private static accounts;

    private static chains = {
        "0x13881": "Matic Testnet",
        "0x7a69": "Local Network",
        "0x539": "Local Network"
    }

    /**
     * Starts user onboarding
     */
    public static start(onChange) {
        // TODO: switch between mock and real web3 impl according to a config
        // this.startMock(onChange);
        this.startWeb3(onChange);
    }


    /**
     * Starts user onboarding using Web3
     */
    private static async startWeb3(onChange) {
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
                this.updateWeb3(onChange);
            });
            window.ethereum.on("chainChanged", () => {
                this.updateWeb3(onChange);
            });
        } 
        this.updateWeb3(onChange);
    }

    private static updateWeb3(onChange) {
        if (!MetaMaskOnboarding.isMetaMaskInstalled()) {
            onChange({ label: "Install MetaMask", onclick: this.installMetaMask.bind(this), error: false, ready: false });
        } else if (!this.accounts || !this.accounts.length) {
            onChange({ label: "Connect to wallet", onclick: this.connectMetaMask.bind(this), error: false, ready: false });
        } else {
            this.metamaskOnboarding.stopOnboarding();
            const chainName = this.chains[window.ethereum.chainId]
            if (chainName) {
                onChange({ label: `Connected to ${chainName}`, onclick: this.connectMetaMask.bind(this), error: false, ready: true });
            } else {
                onChange({ label: "Unsupported network", onclick: this.connectMetaMask.bind(this), error: true, ready: false });
            }
        }
    }

    private static installMetaMask(onChange) {
        this.metamaskOnboarding.startOnboarding();
        onChange({ label: "Onboarding in progress", onclick: undefined, error: false, ready: false });
    }

    private static async connectMetaMask(onChange) {
        if (!window.ethereum) {
            // ethereum not available
            onChange({ label: "Cannot connect to window.ethereum, even though Metamask should be installed!", onclick: undefined, error: true, ready: false });
        } else {
            // connect to ethereum
            this.accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            this.updateWeb3(onChange);
        }
    }


    /**
     * Starts user onboarding using mock impl
     */
    private static startMock(onChange) {
        onChange({ label: "Connect to wallet", onclick: this.connectMock.bind(this), error: false, ready: false });
    }

    private static connectMock(onChange) {
        setTimeout(() => onChange({ label: "Approve allowance for POKER tokens", onclick: this.approveMock.bind(this), error: false, ready: false }, 2000));
    }

    private static approveMock(onChange) {
        setTimeout(() => onChange({ label: "Connected to Mock Network", onclick: undefined, error: false, ready: true }, 2000));
    }
}