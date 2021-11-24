import { ChainId, GameConstants } from "../../../GameConstants";
import { ServiceConfig } from "../../ServiceConfig";
import { Provider } from "./Provider";

/**
 * A provider implementation using JsonRpc
 */
export class JsonRpcProvider implements Provider {
    getRawProvider(): any {
        return GameConstants.CHAIN_ENDPOINTS[ServiceConfig.getChainId()];
    }

    isWeb3Provider(): boolean {
        return false;
    }
}
