import { ChainId, GameConstants } from "../../../GameConstants";
import { ServiceConfig } from "../../ServiceConfig";
import { Provider } from "./Provider";

/**
 * A provider implementation using JsonRpc
 */
export class JsonRpcProvider implements Provider {
    // Unique instance for this provider implementation
    public static currentInstance: Provider;

    private rawProvider;

    // TODO Remove all hardcoded stuff
    constructor() {
        JsonRpcProvider.currentInstance = this;
        this.rawProvider = GameConstants.CHAIN_ENDPOINTS[ServiceConfig.getChainId()];
    }

    getRawProvider(): any {
        return this.rawProvider;
    }

    isWeb3Provider(): boolean {
        return false;
    }
}