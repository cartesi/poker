import { ethers } from "ethers";
import { ChainId } from "../GameConstants";
import { JsonRpcProvider } from "./web3/provider/JsonRpcProvider";
import { MetamaskProvider } from "./web3/provider/MetamaskProvider";
import { PortisProvider } from "./web3/provider/PortisProvider";
import { Provider, ProviderType } from "./web3/provider/Provider";

export enum ServiceType {
    Transport = "transport",
    Engine = "engine",
}

export enum ServiceImpl {
    Mock = "mock",
    Web3 = "web3",
    Real = "real",
}

declare let window: any;

export class ServiceConfig {
    // Unique instance for the service's configurator
    public static currentInstance: ServiceConfig;

    // Connection object to the network
    public provider: Provider;
    // Type of connection
    public providerType: ProviderType;

    // Network with default value
    public chainId: ChainId = ChainId.MATIC_TESTNET;

    // Address for the account which will be signer for transactions
    public signerAddress: string;

    constructor(providerType: ProviderType) {
        ServiceConfig.currentInstance = this;
        ServiceConfig.currentInstance.providerType = providerType;
        ServiceConfig.currentInstance.provider = ServiceConfig.createProvider(providerType);
    }

    private static createProvider(impl: ProviderType): Provider {
        if (impl == ProviderType.Portis) {
            return new PortisProvider();
        } else if (impl == ProviderType.Metamask) {
            return new MetamaskProvider();
        } else if (impl == ProviderType.JsonRpc) {
            return new JsonRpcProvider();
        } else {
            throw new Error("Provider not supported yet");
        }
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

    public static getProvider() {
        let provider;
        if (ServiceConfig.currentInstance.provider.isWeb3Provider()) {
            // Normal webapp usage
            if (ServiceConfig.currentInstance.providerType == ProviderType.Portis) {
                let portisProvider = ServiceConfig.currentInstance.provider.getRawProvider();
                provider = new ethers.providers.Web3Provider(portisProvider.provider);
            } else if (ServiceConfig.currentInstance.providerType == ProviderType.Metamask) {
                let metamaskProvider = ServiceConfig.currentInstance.provider.getRawProvider();
                provider = new ethers.providers.Web3Provider(metamaskProvider);
            } else {
                throw new Error("Unsupported web3 provider.");
            }
        } else {
            // Automated test usage
            provider = new ethers.providers.JsonRpcProvider(ServiceConfig.currentInstance.provider.getRawProvider());
        }
        return provider;
    }

    public static getSigner() {
        let provider = ServiceConfig.getProvider();
        let signerAddress = ServiceConfig.currentInstance.signerAddress;
        return provider.getSigner(signerAddress);
    }

    /**
     * Sets the account address which will sign the calls to the network
     * @param signerAddress Address
     */
    public setSigner(signerAddress: string) {
        this.signerAddress = signerAddress;
    }

    public static isEncryptionEnabled(): boolean {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has("encryption") && searchParams.get("encryption") == "off") {
            return false;
        }
        return true;
    }
}
