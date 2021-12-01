import { BigNumber, ethers } from "ethers";
import { LobbyMock } from "./LobbyMock";

export class WalletMock {
    public static async getAddress() {
        return "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    }

    public static getBalance(): BigNumber {
        // let's pretend the user has 10 ETH or MATIC on the Mock Network
        return ethers.BigNumber.from(10);
    }

    public static getPokerTokens(): BigNumber {
        return LobbyMock.PLAYER_FUNDS;
    }
}
