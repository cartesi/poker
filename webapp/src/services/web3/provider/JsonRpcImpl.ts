import { Provider } from "./Provider";
import Portis from "@portis/web3";

/**
 * A provider implementation using JsonRpc
 */
export class JsonRpcImpl implements Provider {
    // Unique instance for this provider implementation
    public static currentInstance: Provider;

    private rawProvider;

    private wrapableProvider;

    // TODO Remove all hardcoded stuff
    constructor() {
        JsonRpcImpl.currentInstance = this;
        this.wrapableProvider = this.rawProvider = "http://localhost:8545";
    }

    //TODO Maybe this init could be called directly fromconstructor to avoid the client to call it in their App code
    init(): void {
        // Nothing to do for JsonRpc
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
        return JsonRpcImpl.currentInstance;
    }

    getRawProvider(): any {
        return this.rawProvider;
    }

    getWrapableProvider(): any {
        return this.wrapableProvider;
    }

    isWeb3Provider(): boolean {
        return false;
    }

    // TODO Implement
    onActiveWalletChanged(walletChangeHandler: (any: any) => void): void {
        throw new Error("Method not implemented.");
    }
}