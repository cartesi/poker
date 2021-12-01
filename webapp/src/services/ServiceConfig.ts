import { ethers } from "ethers";
import { ChainId } from "../GameConstants";

export enum ServiceType {
    Transport = "transport",
    Engine = "engine",
}

export enum ServiceImpl {
    Mock = "mock",
    Web3 = "web3",
    Real = "real",
}

export enum WalletWeb3Provider {
    Internal = "internal",
    Metamask = "metamask",
    Portis = "portis",
}

declare let window: any;

export class ServiceConfig {
    // Unique instance for the service's configurator
    public static currentInstance: ServiceConfig;

    // Wallet type with default value
    private static walletWeb3Provider = WalletWeb3Provider.Internal;

    // Network with default value
    private static chainId = ChainId.MATIC_TESTNET;

    // Signer to be used when submitting transactions
    private static signer: ethers.Signer;

    /**
     * Retrieves the implementation configured for a specified service type
     *
     * @param type a ServiceType, such as Transport (how communication is done) or Engine (how the game logic is implemented)
     * @returns the configured ServiceImpl, such as a mock, web3 or wasm implementation
     */
    public static get(type: ServiceType): ServiceImpl {
        const defaultImpl = {};
        defaultImpl[ServiceType.Transport] = ServiceImpl.Web3;
        defaultImpl[ServiceType.Engine] = ServiceImpl.Real;

        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has(type)) {
            // returns explicit configuration for the service
            return searchParams.get(type) as ServiceImpl;
        } else if (searchParams.has(ServiceImpl.Mock)) {
            // all services have been explicitly set to "mock"
            return ServiceImpl.Mock;
        } else {
            // no specific configuration set: use service type's default implementation
            return defaultImpl[type];
        }
    }

    public static setWalletWeb3Provider(walletWeb3Provider: WalletWeb3Provider) {
        this.walletWeb3Provider = walletWeb3Provider;
    }

    public static getWalletWeb3Provider(): WalletWeb3Provider {
        if (!this.walletWeb3Provider) {
            throw new Error("WalletWeb3Provider was not set.");
        }
        return this.walletWeb3Provider;
    }

    public static setChain(chainId: ChainId) {
        this.chainId = chainId;
    }

    public static getChainId(): ChainId {
        if (!this.chainId) {
            throw new Error("ChainId was not set.");
        }
        return this.chainId;
    }

    public static getSigner() {
        return this.signer;
    }

    /**
     * Sets the signer to be used when submitting transactions
     * @param signer
     */
    public static setSigner(signer: ethers.Signer) {
        this.signer = signer;
    }

    public static isEncryptionEnabled(): boolean {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has("encryption") && searchParams.get("encryption") == "off") {
            return false;
        }
        return true;
    }
}
