import { ServiceConfig, ServiceType, ServiceImpl } from "./ServiceConfig";
import { WalletMock } from "./mock/WalletMock";
import { WalletWeb3 } from "./web3/WalletWeb3";
import { GameConstants } from "../GameConstants";
import { BigNumber } from "ethers";

export class Wallet {
    /**
     * Returns the currently configured wallet's address.
     * @return an address represented by a 20-byte hex string.
     */
    public static async getAddress(): Promise<string> {
        const impl = ServiceConfig.get(ServiceType.Transport);
        if (impl === ServiceImpl.Mock) {
            // mock wallet
            return WalletMock.getAddress();
        } else if (impl == ServiceImpl.Web3) {
            // web3 wallet
            return await WalletWeb3.getAddress();
        } else {
            // unknown implementation configured
            throw `Unknown transport configuration '${impl}'!`;
        }
    }

    /**
     * Returns the currently configured wallet's network name.
     * @return a network name as a string
     */
    public static getNetwork(): string {
        return ServiceConfig.getChainName();
    }

    /**
     * Returns the currently configured wallet's balance in network funds (ETH/MATIC).
     * @return the balance as a BigNumber.
     */
    public static async getBalance(): Promise<BigNumber> {
        const impl = ServiceConfig.get(ServiceType.Transport);
        if (impl === ServiceImpl.Mock) {
            // mock wallet
            return WalletMock.getBalance();
        } else if (impl == ServiceImpl.Web3) {
            // web3 wallet
            return await WalletWeb3.getBalance();
        } else {
            // unknown implementation configured
            throw `Unknown transport configuration '${impl}'!`;
        }
    }

    /**
     * Returns the currently configured wallet's balance in POKER tokens.
     * @return the number of POKER tokens in the wallet as a BigNumber.
     */
    public static async getPokerTokens(): Promise<BigNumber> {
        const impl = ServiceConfig.get(ServiceType.Transport);
        if (impl === ServiceImpl.Mock) {
            // mock wallet
            return WalletMock.getPokerTokens();
        } else if (impl == ServiceImpl.Web3) {
            // web3 wallet
            return await WalletWeb3.getPokerTokens();
        } else {
            // unknown implementation configured
            throw `Unknown transport configuration '${impl}'!`;
        }
    }
}
