import { ethers } from "ethers";

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
    // Index for the account which will be signer for transactions
    public signerIndex: number;

    constructor() {
        ServiceConfig.currentInstance = this;
        this.signerIndex = 0;
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


    /**
     * @returns true if Metamask was detected or false otherwise
     */
    public static isMetamask() {
        if (typeof window !== "undefined" && window.ethereum) {
            return true;
        } else {
            return false;
        }
    }

    public static getChainId() {
        if (typeof window !== "undefined" && !ServiceConfig.isMetamask()) {
            throw "Cannot connect to window.ethereum. Is Metamask or a similar plugin installed?";
        }

        if (ServiceConfig.isMetamask()) { // Normal webapp usage
            return window.ethereum.chainId;
        } else { // Automated tests usage
            return "0x7a69";
        }
    }

    public static getSigner() {
        if (typeof window !== "undefined" && !ServiceConfig.isMetamask()) {
            throw "Cannot connect to window.ethereum. Is Metamask or a similar plugin installed?";
        }

        let provider;
        if (ServiceConfig.isMetamask()) { // Normal webapp usage
            provider = new ethers.providers.Web3Provider(window.ethereum);
        } else { // Automated test usage
            provider = new ethers.providers.JsonRpcProvider();
        }
        let signerIndex = ServiceConfig.currentInstance.signerIndex;

        return provider.getSigner(signerIndex);
    }

    /**
     * Sets the account which will interact with the network
     * @param _signerIndex Account index (default index is 0)
     */
    public setSigner(_signerIndex: number) {
        this.signerIndex = _signerIndex;
    }
}