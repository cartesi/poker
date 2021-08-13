import { Provider } from "./Provider";

/**
 * A provider implementation using JsonRpc
 */
export class JsonRpcImpl implements Provider {
    // Unique instance for this provider implementation
    public static currentInstance: Provider;

    private rawProvider;

    // TODO Remove all hardcoded stuff
    constructor() {
        JsonRpcImpl.currentInstance = this;
        this.rawProvider = "http://localhost:8545";
    }

    getRawProvider(): any {
        return this.rawProvider;
    }

    isWeb3Provider(): boolean {
        return false;
    }
}