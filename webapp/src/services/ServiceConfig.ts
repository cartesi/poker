import { ethers } from "ethers";
import { JsonRpcImpl } from "./web3/provider/JsonRpcImpl";
import { MetamaskImpl } from "./web3/provider/MetamaskImpl";
import { PortisImpl } from "./web3/provider/PortisImpl";
import { Provider, ProviderImpl } from "./web3/provider/Provider";

export enum ServiceType {
    Transport = "transport",
    Engine = "engine",
}

export enum ServiceImpl {
    Mock = "mock",
    Web3 = "web3",
    Wasm = "wasm",
}

declare let window: any;

export class ServiceConfig {
    // Unique instance for the service's configurator
    public static currentInstance: ServiceConfig;

    // Object to connect to the network
    public provider: Provider;
    // Type of connection (web3, JsonRpc, etc)
    public providerType: ProviderImpl;

    // Address for the account which will be signer for transactions
    public signerAddress: string;

    constructor(providerType: ProviderImpl) {
        ServiceConfig.currentInstance = this;
        ServiceConfig.currentInstance.providerType = providerType;
        ServiceConfig.createProvider(providerType);
    }

    public static createProvider(impl: ProviderImpl): void {
        if (impl == ProviderImpl.Portis) {
            ServiceConfig.currentInstance.provider = new PortisImpl();
        } else if (impl == ProviderImpl.Metamask) {
            ServiceConfig.currentInstance.provider = new MetamaskImpl();
        } else if (impl == ProviderImpl.JsonRpc) {
            ServiceConfig.currentInstance.provider = new JsonRpcImpl();
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
        defaultImpl[ServiceType.Engine] = ServiceImpl.Wasm;

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

    public static getChainId() {
        // TODO Get chainId by chain name (legibility) 
        if (ServiceConfig.currentInstance.provider.isWeb3Provider()) {
            return "0x13881";
        } else {
            return "0x7a69";
        }
    }

    public static getProvider() {
        let provider;
        if (ServiceConfig.currentInstance.provider.isWeb3Provider()) {
            // Normal webapp usage
            if (ServiceConfig.currentInstance.providerType == ProviderImpl.Portis) {
                let portisProvider = ServiceConfig.currentInstance.provider.getRawProvider();
                provider = new ethers.providers.Web3Provider(portisProvider.provider);
            } else if (ServiceConfig.currentInstance.providerType == ProviderImpl.Metamask) {
                let metamaskProvider = ServiceConfig.currentInstance.provider.getRawProvider();
                provider = new ethers.providers.Web3Provider(metamaskProvider);
            } else {
                throw new Error("Unsupported web3 provider.");
            }
        } else {
            // Automated test usage
            provider = new ethers.providers.JsonRpcProvider();
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
