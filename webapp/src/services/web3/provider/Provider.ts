export enum ProviderImpl {
    Portis = "Portis",
    Metamask = "Metamask",
    JsonRpc = "JsonRpc",
}

/**
 * Abstracts a connection to a network
 */
export interface Provider {
    init(): void;
    showSetupUI(): void;

    getAccounts(): any;
    getInstance(): Provider;
    getRawProvider(): any;
    getWrapableProvider(): any;

    isWeb3Provider(): boolean;

    onActiveWalletChanged(walletChangeHandler: (any) => void): void;
}