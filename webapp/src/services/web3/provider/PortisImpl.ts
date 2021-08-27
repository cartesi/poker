import { ethers } from "ethers";
import Portis from "@portis/web3";
import { Provider } from "./Provider";
import { Chain, GameConstants } from "../../../GameConstants";
import { ServiceConfig } from "../../ServiceConfig";

/**
 * A provider implementation using Portis
 */
export class PortisImpl implements Provider {
    // Unique instance for this provider implementation
    public static currentInstance: Provider;

    private rawProvider;

    constructor() {
        PortisImpl.currentInstance = this;

        let portis = new Portis(GameConstants.PROVIDER_PORTIS_APPID, {
            nodeUrl: GameConstants.CHAIN_ENDPOINTS[ServiceConfig.getChainId()],
            chainId: ServiceConfig.getChainId(),
        });
        this.rawProvider = portis;
    }

    getRawProvider(): any {
        return this.rawProvider;
    }

    isWeb3Provider(): boolean {
        return true;
    }
}