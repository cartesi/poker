import { ethers } from "ethers";
import Portis from "@portis/web3";
import PokerToken from "./abis/PokerToken.json";
import PokerTokenFaucet from "./abis/PokerTokenFaucet.json";

declare let window: any;

enum Wallet {
    METAMASK = "METAMASK",
    PORTIS = "PORTIS",
}

const PORTIS_APP_ID = "15ce62b0-b226-4e6f-9f8d-abbdf8f2cda2";

const DEFAULT_CHAIN_URL = "https://matic-testnet-archive-rpc.bwarelabs.com";
const DEFAULT_CHAIN_ID = "0x13881";

class PokerFaucet {
    private selectedWallet = Wallet.METAMASK;
    private provider;

    public static readonly CHAINS = {
        "0x13881": "Matic Testnet",
        "0x7a69": "Local Network",
        "0x539": "Local Network",
    };

    async init() {
        this.initGUI();
        this.setWalletRadioListener();
        this.setTargetInputListener();
        this.setRequestButtonListener();

        this.provider = await this.getProvider();
        await this.updateGUI();
    }

    initGUI() {
        // Check default wallet
        let radios = document.getElementsByName("wallet");
        for (let i = 0; i < radios.length; i++) {
            if (radios[i].id == Wallet.METAMASK) {
                radios[i].setAttribute("checked", "true");
                break;
            }
        }

        // Loading info (Portis takes some time to load)
        this.showLoadingInfo();
    }

    showLoadingInfo() {
        (document.getElementById("requestButton") as HTMLButtonElement).disabled = true;

        document.getElementById("network").innerHTML = "Loading...";
        document.getElementById("address").innerHTML = "Loading...";
        document.getElementById("balance").innerHTML = "Loading...";
    }

    async updateGUI() {
        const signer = this.provider.getSigner();
        const address = await signer.getAddress();
        const chainId = await this.getChainId();
        const network = PokerFaucet.CHAINS[chainId] ? PokerFaucet.CHAINS[chainId] : "Unsupported Network";

        const tokenContract = new ethers.Contract(PokerToken.address, PokerToken.abi, signer);
        document.getElementById("network").innerHTML = network;
        document.getElementById("address").innerHTML = address;

        const targetInput = <HTMLInputElement>document.getElementById("target");
        const requestButton = document.getElementById("requestButton") as HTMLButtonElement;
        try {
            if (targetInput.value) {
                document.getElementById("balance").innerHTML = await tokenContract.balanceOf(targetInput.value);
                requestButton.disabled = false;
                return;
            }
        } catch (error) {
            // normal, input is not a valid address
        }
        document.getElementById("balance").innerHTML = "N/A";
        requestButton.disabled = true;
    }

    setWalletRadioListener() {
        let radios = document.getElementsByName("wallet");
        for (let i = 0; i < radios.length; i++) {
            radios[i].addEventListener("change", async (e) => {
                let id = (e.target as HTMLElement).id;
                switch (id) {
                    case Wallet.PORTIS:
                        this.selectedWallet = Wallet.PORTIS;
                        break;
                    case Wallet.METAMASK:
                        this.selectedWallet = Wallet.METAMASK;
                        break;
                    default:
                        throw new Error("Unsupported wallet was found");
                }
                this.showLoadingInfo();
                this.provider = await this.getProvider();
                await this.updateGUI();
            });
        }
    }

    setTargetInputListener() {
        const input = document.getElementById("target");
        input.addEventListener("input", this.updateGUI.bind(this));
    }

    setRequestButtonListener() {
        const button = document.getElementById("requestButton");
        button.addEventListener("click", this.request.bind(this));
    }

    async getChainId(): Promise<string> {
        switch (this.selectedWallet) {
            case Wallet.METAMASK:
                return window.ethereum.chainId;
            default:
                return DEFAULT_CHAIN_ID;
        }
    }

    async getProvider(): Promise<any> {
        switch (this.selectedWallet) {
            case Wallet.PORTIS:
                this.provider = this.getProviderFromPortis();
                break;
            case Wallet.METAMASK:
                this.provider = this.getProviderFromMetamask();
                break;
            default:
                throw new Error("Unsupported wallet was found");
        }
        if (this.provider) {
            return this.provider;
        } else {
            throw new Error("Unable to instantiate the provider to connect to the network");
        }
    }

    async getProviderFromPortis(): Promise<any> {
        console.log("Using Portis as provider");

        let portis;
        try {
            portis = new Portis(PORTIS_APP_ID, {
                nodeUrl: DEFAULT_CHAIN_URL,
                chainId: DEFAULT_CHAIN_ID,
            });
        } catch (error) {
            console.log(error);
        }

        portis.showPortis();

        return new Promise((resolve) => {
            portis.isLoggedIn().then(({ error, result }) => {
                let provider = new ethers.providers.Web3Provider(portis.provider);
                resolve(provider);
            });
        });
    }

    async getProviderFromMetamask() {
        console.log("Using Metamask as provider");

        if (!window.ethereum) {
            console.error("Cannot connect to window.ethereum. Is Metamask or a similar plugin installed?");
            return;
        }
        // sets up hooks to update web3 when accounts or chain change
        window.ethereum.on("accountsChanged", async () => {
            this.showLoadingInfo();
            await this.updateGUI();
        });
        window.ethereum.on("chainChanged", async () => {
            this.showLoadingInfo();
            await this.updateGUI();
        });

        // connects to ethereum account
        await window.ethereum.request({ method: "eth_requestAccounts" });

        return new ethers.providers.Web3Provider(window.ethereum);
    }

    async request() {
        const signer = this.provider.getSigner();
        const address = (<HTMLInputElement>document.getElementById("target")).value;

        const faucetContract = new ethers.Contract(PokerTokenFaucet.address, PokerTokenFaucet.abi, signer);

        await faucetContract.requestTokens(address);

        const amount = await faucetContract.TOKEN_AMOUNT();
        alert(`Requested ${amount} POKER tokens for ${address}`);

        this.showLoadingInfo();
        await this.updateGUI();
    }
}

var faucet = new PokerFaucet();
faucet.init();
