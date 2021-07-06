import { ethers } from "ethers";
import { GameConstants } from "../GameConstants";

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
    /**
     * Retrieves the implementation configured for a specified service type
     *
     * @param type a ServiceType, such as Transport (how communication is done) or Engine (how the game logic is implemented)
     * @returns the configured ServiceImpl, such as a mock, web3 or wasm implementation
     */
    public static get(type: ServiceType): ServiceImpl {
        const defaultImpl = {};
        defaultImpl[ServiceType.Transport] = ServiceImpl.Web3;
        defaultImpl[ServiceType.Engine] = ServiceImpl.Mock;

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
     * Retrieves the configuration needed by web3 services to make calls to the smart contracts.
     * 
     * @returns json with the web3 provider to be used by services and the chainId
     */
    public static getProviderConfiguration() {
        let provider;
        let chainId;
        if (typeof window !== "undefined") { // Normal webapp usage
            if (!window.ethereum) {
                throw "Cannot connect to window.ethereum. Is Metamask or a similar plugin installed?";
            } else {
                provider = new ethers.providers.Web3Provider(window.ethereum);
                chainId = window.ethereum.chainId;
            }
        } else { // Automated test usage
            provider = new ethers.providers.JsonRpcProvider();
            chainId = GameConstants.CHAINS["0x7a69"];
        }

        return {
            provider: provider,
            chainId: chainId
        };
    }
}