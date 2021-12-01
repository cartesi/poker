import { BigNumber, ethers } from "ethers";
import { ServiceConfig } from "../ServiceConfig";
import { PokerToken__factory } from "../../types";
import PokerToken from "../../abis/PokerToken.json";

export class WalletWeb3 {
    public static async getAddress() {
        const signer = ServiceConfig.getSigner();
        if (!signer) {
            return ethers.constants.AddressZero;
        } else {
            return await signer.getAddress();
        }
    }

    public static async getBalance(): Promise<BigNumber> {
        const signer = ServiceConfig.getSigner();
        if (!signer) {
            return ethers.constants.Zero;
        } else {
            return await signer.getBalance();
        }
    }

    public static async getPokerTokens(): Promise<BigNumber> {
        const signer = ServiceConfig.getSigner();
        if (!signer) {
            return ethers.constants.Zero;
        } else {
            const playerAddress = await signer.getAddress();
            const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, signer);
            return await pokerTokenContract.balanceOf(playerAddress);
        }
    }
}
