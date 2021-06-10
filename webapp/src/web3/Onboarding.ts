import { ethers } from "ethers";

declare let window: any;

export class Onboarding {

    /**
     * Starts user onboarding
     */
    public static start(onChange) {
        // TODO: switch between mock and real web3 impl according to a config
        this.startMock(onChange);
        // this.startWeb3(onChange);
    }


    /**
     * Starts user onboarding using Web3
     */
    private static async startWeb3(onChange) {
        if (!window.ethereum) {
            console.error("Cannot connect to window.ethereum. Is Metamask or a similar plugin installed?");
            return;
        }

        // connect to ethereum
        await window.ethereum.request({ method: "eth_requestAccounts" });

        // retrieves provider + signer (e.g., from metamask)
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const playerAddress = await signer.getAddress();
    }

    /**
     * Starts user onboarding using mock impl
     */
    private static async startMock(onChange) {
        setTimeout(() => onChange({ ready: true}), 0);
    }
}
