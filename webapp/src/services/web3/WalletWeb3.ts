import { BigNumber, ethers } from "ethers";
import { ServiceConfig } from "../ServiceConfig";
import { PokerToken__factory } from "../../types";
import PokerToken from "../../abis/PokerToken.json";
import { ErrorHandler } from "../ErrorHandler";

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
            let balance;
            await ErrorHandler.execute("pokerTokenBalance", async () => {
                balance = await signer.getBalance();
            });
            return balance;
        }
    }

    public static async getPokerTokens(): Promise<BigNumber> {
        const signer = ServiceConfig.getSigner();
        if (!signer) {
            return ethers.constants.Zero;
        } else {
            const playerAddress = await signer.getAddress();
            const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, signer);
            let tokenBalance;
            await ErrorHandler.execute("pokerTokenBalance", async () => {
                tokenBalance = await pokerTokenContract.balanceOf(playerAddress);
            });
            return tokenBalance;
        }
    }
}
