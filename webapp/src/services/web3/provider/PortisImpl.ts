import { ethers } from "ethers";
import Portis from "@portis/web3";
import { Provider } from "./Provider";
import { GameConstants } from "../../../GameConstants";

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
            nodeUrl: GameConstants.PROVIDER_WEB3_ENDPOINT,
            chainId: GameConstants.PROVIDER_WEB3_CHAINID,
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