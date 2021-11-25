import { ethers } from "ethers";
import { ServiceConfig } from "../../../src/services/ServiceConfig";

export class TestWeb3Utils {
    /**
     * Sets the signer being used in the test environment
     * @param address
     */
    public static setSigner(address: string) {
        const provider = new ethers.providers.JsonRpcProvider();
        const signer = provider.getSigner(address);
        ServiceConfig.setSigner(signer);
    }

    /**
     * Adds a given number of seconds to the next block's timestamp
     * @param secondsToAdd
     */
    public static async increaseTime(secondsToAdd: number): Promise<void> {
        const provider = new ethers.providers.JsonRpcProvider();
        await provider.send("evm_increaseTime", [secondsToAdd]);
    }
}
