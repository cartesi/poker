import { ethers } from "ethers";
import Portis from "@portis/web3";
import PokerToken from "./abis/PokerToken.json";
import PokerTokenFaucet from "./abis/PokerTokenFaucet.json";

declare let window: any;

enum Wallet {
    PORTIS = "PORTIS",
    METAMASK = "METAMASK"
}

const PORTIS_APP_ID = "15ce62b0-b226-4e6f-9f8d-abbdf8f2cda2";

const CHAIN_URL = "https://matic-mumbai.chainstacklabs.com";
const CHAIN_ID = "0x13881";

class PokerFaucet {
    private selectedWallet = Wallet.PORTIS;

    public static readonly CHAINS = {
        "0x13881": "Matic Testnet",
        "0x7a69": "Local Network",
        "0x539": "Local Network",
    };

    async init() {
        this.initGUI();

        let provider = await this.getProvider();
        if (!provider) {
            throw new Error("Unable to instantiate the provider to connect to the network");
        }

        const signer = provider.getSigner();
        const address = await signer.getAddress();
        const network = PokerFaucet.CHAINS[CHAIN_ID]
            ? PokerFaucet.CHAINS[CHAIN_ID]
            : "Unsupported Network";

        const tokenContract = new ethers.Contract(PokerToken.address, PokerToken.abi, signer);
        document.getElementById("network").innerHTML = network;
        document.getElementById("address").innerHTML = address;
        document.getElementById("balance").innerHTML = await tokenContract.balanceOf(address);

        this.setWalletRadioListener();
        this.setRequestButtonListener();

        (document.getElementById("requestButton") as HTMLButtonElement).disabled = false;
    }

    initGUI() {
        // Check default wallet
        let radios = document.getElementsByName("wallet");
        for (let i = 0; i < radios.length; i++) {
            if (radios[i].id == Wallet.PORTIS) {
                radios[i].setAttribute("checked", "true");
                break;
            }
        }

        // Loading info (Portis takes some time to load)
        document.getElementById("network").innerHTML = "Loading...";
        document.getElementById("address").innerHTML = "Loading...";
        document.getElementById("balance").innerHTML = "Loading...";

        // Disbable request button until provider is ready
        (document.getElementById("requestButton") as HTMLButtonElement).disabled = true;
    }

    setWalletRadioListener() {
        let radios = document.getElementsByName("wallet");
        for (let i = 0; i < radios.length; i++) {
            radios[i].addEventListener("change", (e) => {
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
                };
            });
        }
    }

    setRequestButtonListener() {
        const button = document.getElementById("requestButton");
        button.addEventListener("click", this.request.bind(this));
    }

    async getProvider(): Promise<any> {
        if (this.selectedWallet == Wallet.PORTIS) {
            return this.getProviderFromPortis();
        } else if (this.selectedWallet == Wallet.METAMASK) {
            return this.getProviderFromMetamask();
        } else {
            throw new Error("Unsupported wallet was found");
        }
    }

    async getProviderFromPortis(): Promise<any> {
        console.log("Using Portis as provider");

        let portis;
        try {
            portis = new Portis(PORTIS_APP_ID, {
                nodeUrl: CHAIN_URL,
                chainId: CHAIN_ID,
            });
        } catch (error) {
            console.log(error);
        }

        portis.showPortis();

        return new Promise((resolve) => {
            portis.isLoggedIn()
                .then(({ error, result }) => {
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
        window.ethereum.on("accountsChanged", () => {
            location.reload();
        });
        window.ethereum.on("chainChanged", () => {
            location.reload();
        });

        // connects to ethereum account
        await window.ethereum.request({ method: "eth_requestAccounts" });

        return new ethers.providers.Web3Provider(window.ethereum);
    }

    async request() {
        const provider = await this.getProvider();
        const signer = provider.getSigner();
        const address = await signer.getAddress();

        const faucetContract = new ethers.Contract(PokerTokenFaucet.address, PokerTokenFaucet.abi, signer);

        await faucetContract.requestTokens();

        const amount = await faucetContract.TOKEN_AMOUNT();
        alert(`Requested ${amount} POKER tokens for ${address}`);
    }
}

var faucet = new PokerFaucet();
faucet.init();
