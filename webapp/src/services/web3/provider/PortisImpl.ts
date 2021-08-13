import { Provider } from "./Provider";
import Portis from "@portis/web3";

/**
 * A provider implementation using Portis
 */
export class PortisImpl implements Provider {
    // Unique instance for this provider implementation
    public static currentInstance: Provider;

    private rawProvider;

    private wrapableProvider;

    // TODO Remove all hardcoded stuff
    constructor() {
        PortisImpl.currentInstance = this;

        let portis = new Portis('15ce62b0-b226-4e6f-9f8d-abbdf8f2cda2', {
            nodeUrl: 'https://matic-testnet-archive-rpc.bwarelabs.com',
            chainId: '80001',
        });
        this.rawProvider = portis;
        this.wrapableProvider = portis.provider;
    }

    //TODO Maybe this init could be called directly fromconstructor to avoid the client to call it in their App code
    init(): void {
        // Nothing to do for Portis
    }

    //TODO Implement
    showSetupUI(): void {
        throw new Error("Method not implemented.");
    }

    //TODO Implement
    getAccounts() {
        throw new Error("Method not implemented.");
    }

    getInstance(): Provider {
        return PortisImpl.currentInstance;
    }

    getRawProvider(): any {
        return this.rawProvider;
    }

    getWrapableProvider(): any {
        return this.wrapableProvider;
    }

    isWeb3Provider(): boolean {
        return true;
    }

    // TODO Implement
    onActiveWalletChanged(walletChangeHandler: (any: any) => void): void {
        throw new Error("Method not implemented.");
    }
}