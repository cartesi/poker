import { GameConstants } from "../../../GameConstants";
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
        this.rawProvider = GameConstants.PROVIDER_JSONRPC_ENDPOINT;
    }

    getRawProvider(): any {
        return this.rawProvider;
    }

    isWeb3Provider(): boolean {
        return false;
    }
}