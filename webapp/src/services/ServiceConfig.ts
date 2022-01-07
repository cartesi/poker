import { ethers } from "ethers";
import { ChainId, GameConstants } from "../GameConstants";

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
    // Network with default value
    private static chainId = ChainId.MATIC_TESTNET;

    // Signer to be used when submitting transactions
    private static signer: ethers.Signer;

    // Wallet type to be used when onboarding
    private static walletWeb3Provider: WalletWeb3Provider;

    // service configurations
    private static defaultServiceImpl = { transport: ServiceImpl.Web3, engine: ServiceImpl.Real };
    private static serviceImpl = {};

    /**
     * Retrieves the implementation configured for a specified service type
     *
     * @param type a ServiceType, such as Transport (how communication is done) or Engine (how the game logic is implemented)
     * @returns the configured ServiceImpl, such as a mock, web3 or wasm implementation
     */
    public static get(type: ServiceType): ServiceImpl {
        if (this.serviceImpl[type]) {
            // service impl explicitly defined
            return this.serviceImpl[type];
        }
        try {
            const searchParams = new URLSearchParams(window.location.search);
            if (searchParams.has(type)) {
                // returns explicit configuration for the service from the URL search params
                return searchParams.get(type) as ServiceImpl;
            } else if (searchParams.has(ServiceImpl.Mock)) {
                // all services have been explicitly set to "mock" from the URL search params
                return ServiceImpl.Mock;
            }
        } catch (error) {
            // error retrieving search params (it is not available)
        }
        // no specific configuration set: use service type's default implementation
        return this.defaultServiceImpl[type];
    }

    /**
     * Explicitly defines the implementation to be used for a specified service type
     *
     * @param type a ServiceType, such as Transport (how communication is done) or Engine (how the game logic is implemented)
     * @param impl a ServiceImpl, such as a mock, web3 or wasm implementation
     */
    public static set(type: ServiceType, impl: ServiceImpl) {
        this.serviceImpl[type] = impl;
    }

    public static setWalletWeb3Provider(walletWeb3Provider: WalletWeb3Provider) {
        this.walletWeb3Provider = walletWeb3Provider;
    }

    public static getWalletWeb3Provider(): WalletWeb3Provider {
        if (!this.walletWeb3Provider) {
            const searchParams = new URLSearchParams(window.location.search);
            const walletParam = searchParams.get("wallet");
            if (walletParam) {
                for (let key in WalletWeb3Provider) {
                    const provider = WalletWeb3Provider[key];
                    if (provider == walletParam) {
                        this.walletWeb3Provider = provider;
                    }
                }
                if (!this.walletWeb3Provider) {
                    console.error(
                        `Unknown wallet web3 provider '${walletParam}'. Using default wallet '${WalletWeb3Provider.Internal}'`
                    );
                }
            }
            if (!this.walletWeb3Provider) {
                this.walletWeb3Provider = WalletWeb3Provider.Internal;
            }
        }
        return this.walletWeb3Provider;
    }

    public static setChainId(chainId: ChainId) {
        this.chainId = chainId;
    }

    public static getChainId(): ChainId {
        if (!this.chainId) {
            throw new Error("ChainId was not set.");
        }
        return this.chainId;
    }

    public static getChainName(): string {
        return GameConstants.CHAIN_NAMES[this.chainId];
    }

    public static getChainCurrency(): string {
        return GameConstants.CHAIN_CURRENCIES[this.chainId];
    }

    public static getChainCurrencyLowValue(): number {
        return GameConstants.CHAIN_CURRENCIES_LOW_VALUE[this.chainId];
    }

    public static getChainEndpoint(): string {
        if (!this.chainId) {
            throw new Error("ChainId was not set.");
        }
        const endpoints = GameConstants.CHAIN_ENDPOINTS[this.chainId];
        if (!endpoints || !endpoints.length) {
            throw new Error(`No endpoints configured for chain id ${this.chainId}`);
        }
        const endpointRandomIndex = Math.floor(Math.random() * endpoints.length);
        const endpoint = endpoints[endpointRandomIndex];
        console.log(`Using RPC endpoint ${endpoint}`);
        return endpoint;
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

    public static getPredefinedWinnerId(): number {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get("encryption") == "off" && searchParams.has("winner")) {
            return Number(searchParams.get("winner"));
        }
        return -1;
    }
}
