import { ethers } from "ethers";
import PokerToken from "./abis/PokerToken.json";
import PokerTokenFaucet from "./abis/PokerTokenFaucet.json";

declare let window: any;

class PokerFaucet {
    public static readonly CHAINS = {
        "0x13881": "Matic Testnet",
        "0x7a69": "Local Network",
        "0x539": "Local Network",
    };

    async init() {
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

        // retrieves provider + signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        const network = PokerFaucet.CHAINS[window.ethereum.chainId]
            ? PokerFaucet.CHAINS[window.ethereum.chainId]
            : "Unsupported Network";

        const tokenContract = new ethers.Contract(PokerToken.address, PokerToken.abi, signer);
        document.getElementById("network").innerHTML = network;
        document.getElementById("address").innerHTML = address;
        document.getElementById("balance").innerHTML = await tokenContract.balanceOf(address);

        const button = document.getElementById("requestButton");
        button.addEventListener("click", this.request.bind(this));
    }

    async request() {
        // retrieves provider + signer (e.g., from metamask)
        const provider = new ethers.providers.Web3Provider(window.ethereum);
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
