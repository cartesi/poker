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

export enum ProviderType {
    Portis = "Portis",
    Metamask = "Metamask",
    JsonRpc = "JsonRpc",
}

declare let window: any;

export class ServiceConfig {
    // Unique instance for the service's configurator
    public static currentInstance: ServiceConfig;

    // Type of connection
    public providerType: ProviderType;

    // Network with default value
    public chainId: ChainId = ChainId.MATIC_TESTNET;

    // Signer to be used when submitting transactions
    public signer: ethers.Signer;

    constructor(providerType: ProviderType) {
        ServiceConfig.currentInstance = this;
        ServiceConfig.currentInstance.providerType = providerType;
    }

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

    public setChain(chainId: ChainId) {
        this.chainId = chainId;
    }

    public static getChainId(): ChainId {
        if (!ServiceConfig.currentInstance.chainId) {
            throw new Error("ChainId was not set.");
        }
        return ServiceConfig.currentInstance.chainId;
    }

    public static getSigner() {
        return ServiceConfig.currentInstance.signer;
    }

    /**
     * Sets the signer to be used when submitting transactions
     * @param signer
     */
    public setSigner(signer: ethers.Signer) {
        ServiceConfig.currentInstance.signer = signer;
    }

    public static isEncryptionEnabled(): boolean {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has("encryption") && searchParams.get("encryption") == "off") {
            return false;
        }
        return true;
    }
}
