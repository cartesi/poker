export enum ProviderType {
    Portis = "Portis",
    Metamask = "Metamask",
    JsonRpc = "JsonRpc",
}

/**
 * Abstracts a connection to a network
 */
export interface Provider {
    getRawProvider(): any;
    isWeb3Provider(): boolean;
}