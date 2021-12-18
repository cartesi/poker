import { ethers } from "ethers";
import PokerToken from "./abis/PokerToken.json";
import PokerTokenFaucet from "./abis/PokerTokenFaucet.json";

const CHAIN_URL = "https://matic-testnet-archive-rpc.bwarelabs.com";
const j = `{"address":"0a0ee891887c2785beb86f186f44e8b5e22ea7a9","id":"f6ea2099-28d1-4762-a595-ec7a6612517c","version":3,"Crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"8f7d09f10c9d163fe044ef4d039bfdb9"},"ciphertext":"28922d7465eb1adafd7c7881937c43ac9073068fb024b0a18e125c068a16b890","kdf":"scrypt","kdfparams":{"salt":"5e70e29acb906ccd928d5e46b1f6096cc33627138c26c1ebd9cc61c7d1cfc4a9","n":131072,"dklen":32,"p":1,"r":8},"mac":"1087bdb4cc14a36b46052ad7aa39a9c72f3e61dfff856599669d4ec66b3768d4"},"x-ethers":{"client":"ethers.js","gethFilename":"UTC--2021-12-18T22-08-45.0Z--0a0ee891887c2785beb86f186f44e8b5e22ea7a9","mnemonicCounter":"c8ff75074bda324af11ebd3da3e59284","mnemonicCiphertext":"4d1ed397abc7bf450663102f8cc43564","path":"m/44'/60'/0'/0/0","locale":"en","version":"0.1"}}`;
const p = "xPJG8EC$6Rr3";

class PokerFaucet {
    private signer;

    async init() {
        this.showLoadingInfo();
        this.setTargetInputListener();
        this.setRequestButtonListener();

        this.signer = await this.getSigner();
        await this.updateGUI();
    }

    showLoadingInfo() {
        (document.getElementById("requestButton") as HTMLButtonElement).disabled = true;
        document.getElementById("balanceMatic").innerHTML = "Loading...";
        document.getElementById("balancePoker").innerHTML = "Loading...";
    }

    async updateGUI() {
        const tokenContract = new ethers.Contract(PokerToken.address, PokerToken.abi, this.signer);
        const targetInput = <HTMLInputElement>document.getElementById("target");
        const requestButton = document.getElementById("requestButton") as HTMLButtonElement;
        try {
            if (targetInput.value) {
                document.getElementById("balanceMatic").innerHTML = ethers.utils.formatEther(
                    await this.signer.provider.getBalance(targetInput.value)
                );
                document.getElementById("balancePoker").innerHTML = await tokenContract.balanceOf(targetInput.value);
                requestButton.disabled = false;
                return;
            }
        } catch (error) {
            // normal, input is not a valid address
        }
        document.getElementById("balanceMatic").innerHTML = "N/A";
        document.getElementById("balancePoker").innerHTML = "N/A";
        requestButton.disabled = true;
    }

    setTargetInputListener() {
        const input = document.getElementById("target");
        input.addEventListener("input", this.updateGUI.bind(this));
    }

    setRequestButtonListener() {
        const button = document.getElementById("requestButton");
        button.addEventListener("click", this.request.bind(this));
    }

    async getSigner(): Promise<any> {
        if (!this.signer) {
            const provider = new ethers.providers.JsonRpcProvider(CHAIN_URL);
            const wallet = await ethers.Wallet.fromEncryptedJson(j, p);
            this.signer = wallet.connect(provider);
            console.log(`Configured signer with address ${wallet.address}`);
        }
        return this.signer;
    }

    async request() {
        const address = (<HTMLInputElement>document.getElementById("target")).value;

        const faucetContract = new ethers.Contract(PokerTokenFaucet.address, PokerTokenFaucet.abi, this.signer);

        this.showLoadingInfo();

        // request MATIC tokens
        let amountMatic;
        let txMatic;
        try {
            amountMatic = ethers.utils.formatEther(await faucetContract.getRequestFundsAmount());
            txMatic = await faucetContract.requestFunds(address);
        } catch (error) {
            console.error(`Failed to request MATIC: ${JSON.stringify(error)}`);
        }

        // request POKER tokens
        let amountPoker;
        let txPoker;
        try {
            amountPoker = await faucetContract.getRequestTokensAmount();
            txPoker = await faucetContract.requestTokens(address);
        } catch (error) {
            console.error(`Failed to request POKER: ${JSON.stringify(error)}`);
        }

        // inform user of request results
        let msg;
        if (txMatic && txPoker) {
            msg = `Successfully requested ${amountPoker} POKER tokens and ${amountMatic} MATIC for ${address}`;
        } else if (txMatic) {
            msg = `Successfully requested ${amountMatic} MATIC for ${address} (failed to request POKER tokens)`;
        } else if (txPoker) {
            msg = `Successfully requested ${amountPoker} POKER tokens for ${address} (failed to request MATIC)`;
        } else {
            msg = `Failed to request POKER and MATIC for ${address}`;
        }

        document.getElementById("message").innerHTML = msg;

        if (txMatic) {
            await txMatic.wait();
        }
        if (txPoker) {
            await txPoker.wait();
        }

        await this.updateGUI();
        document.getElementById("message").innerHTML = "";
    }
}

var faucet = new PokerFaucet();
faucet.init();
