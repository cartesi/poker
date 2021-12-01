import { BigNumber } from "ethers";
import { ServiceConfig } from "../ServiceConfig";
import { PokerToken__factory } from "../../types";
import PokerToken from "../../abis/PokerToken.json";

export class WalletWeb3 {
    public static async getAddress() {
        return await ServiceConfig.getSigner().getAddress();
    }

    public static async getBalance(): Promise<BigNumber> {
        return await ServiceConfig.getSigner().getBalance();
    }

    public static async getPokerTokens(): Promise<BigNumber> {
        const signer = ServiceConfig.getSigner();
        const playerAddress = await signer.getAddress();
        const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, signer);
        return await pokerTokenContract.balanceOf(playerAddress);
    }
}
