import { ethers } from "ethers";
import PokerToken from "./abis/PokerToken.json";
import PokerTokenFaucet from "./abis/PokerTokenFaucet.json";

const CHAIN_URL = "https://matic-testnet-archive-rpc.bwarelabs.com";
const j = `{"address":"0a0ee891887c2785beb86f186f44e8b5e22ea7a9","id":"f6ea2099-28d1-4762-a595-ec7a6612517c","version":3,"Crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"8f7d09f10c9d163fe044ef4d039bfdb9"},"ciphertext":"28922d7465eb1adafd7c7881937c43ac9073068fb024b0a18e125c068a16b890","kdf":"scrypt","kdfparams":{"salt":"5e70e29acb906ccd928d5e46b1f6096cc33627138c26c1ebd9cc61c7d1cfc4a9","n":131072,"dklen":32,"p":1,"r":8},"mac":"1087bdb4cc14a36b46052ad7aa39a9c72f3e61dfff856599669d4ec66b3768d4"},"x-ethers":{"client":"ethers.js","gethFilename":"UTC--2021-12-18T22-08-45.0Z--0a0ee891887c2785beb86f186f44e8b5e22ea7a9","mnemonicCounter":"c8ff75074bda324af11ebd3da3e59284","mnemonicCiphertext":"4d1ed397abc7bf450663102f8cc43564","path":"m/44'/60'/0'/0/0","locale":"en","version":"0.1"}}`;
const p = "xPJG8EC$6Rr3";

class PokerFaucet {
    private signer;
    private isTargetValid;

    async init() {
        this.showLoadingInfo();
        this.setInputListeners();
        this.setRequestButtonListener();

        this.signer = await this.getSigner();
        await this.updateGUI();
    }

    showLoadingInfo() {
        (document.getElementById("requestButton") as HTMLButtonElement).disabled = true;
        document.getElementById("balanceMatic").innerHTML = "Loading...";
        document.getElementById("balancePoker").innerHTML = "Loading...";
    }

    async updateGUI(couponChanged?: boolean, targetChanged?: boolean) {
        // retrieves contracts
        const tokenContract = new ethers.Contract(PokerToken.address, PokerToken.abi, this.signer);
        const faucetContract = new ethers.Contract(PokerTokenFaucet.address, PokerTokenFaucet.abi, this.signer);

        // retrieves current input values
        const couponInput = <HTMLInputElement>document.getElementById("coupon");
        const targetInput = <HTMLInputElement>document.getElementById("target");

        // basic checks: is faucet suspended or has no coupon been provided?
        const requestButton = document.getElementById("requestButton") as HTMLButtonElement;
        const isSuspended = await faucetContract.isSuspended();
        if (isSuspended) {
            document.getElementById("message").innerHTML = "Faucet is suspended";
        }

        if (!couponChanged) {
            // tries to update info for the target address
            try {
                if (targetInput.value) {
                    document.getElementById("balanceMatic").innerHTML = ethers.utils.formatEther(
                        await this.signer.provider.getBalance(targetInput.value)
                    );
                    this.isTargetValid = true;
                    document.getElementById("balancePoker").innerHTML = await tokenContract.balanceOf(
                        targetInput.value
                    );
                } else {
                    this.isTargetValid = false;
                }
            } catch (error) {
                // normal, input is not a valid address
                this.isTargetValid = false;
            }
        }

        if (!this.isTargetValid) {
            // balances are not available when there is no valid address
            document.getElementById("balanceMatic").innerHTML = "N/A";
            document.getElementById("balancePoker").innerHTML = "N/A";
        }
        if (!isSuspended) {
            // clears message info if not suspended
            document.getElementById("message").innerHTML = "";
        }
        // checks whether requests should be allowed
        if (!isSuspended && this.isTargetValid && couponInput.value) {
            // allow requests because:
            // - faucet is not suspended
            // - target address is valid
            // - there is content in the coupon input
            requestButton.disabled = false;
        } else {
            requestButton.disabled = true;
        }
    }

    setInputListeners() {
        const self = this;
        const coupon = document.getElementById("coupon");
        coupon.addEventListener("input", () => this.updateGUI(true, false));
        const target = document.getElementById("target");
        target.addEventListener("input", () => self.updateGUI(false, true));
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
        const coupon = (<HTMLInputElement>document.getElementById("coupon")).value;
        const address = (<HTMLInputElement>document.getElementById("target")).value;

        const faucetContract = new ethers.Contract(PokerTokenFaucet.address, PokerTokenFaucet.abi, this.signer);

        this.showLoadingInfo();

        // redeems coupon
        let amountMatic;
        let amountPoker;
        let tx;
        try {
            amountMatic = ethers.utils.formatEther(await faucetContract.getRequestFundsAmount());
            amountPoker = await faucetContract.getRequestTokensAmount();
            tx = await faucetContract.redeemCoupon(coupon, address);
        } catch (error) {
            console.error(`Failed to redeem coupon: ${JSON.stringify(error)}`);
        }

        // informs user of request results
        let msg;
        if (tx) {
            msg = `Successfully redeemed coupon '${coupon}' to request ${amountPoker} POKER tokens and ${amountMatic} MATIC for ${address}`;
        } else {
            msg = `Failed to redeem coupon '${coupon}'`;
        }
        document.getElementById("message").innerHTML = msg;

        // waits for transaction to go through before updating the GUI
        if (tx) {
            await tx.wait();
        }
        await this.updateGUI();
    }
}

var faucet = new PokerFaucet();
faucet.init();
