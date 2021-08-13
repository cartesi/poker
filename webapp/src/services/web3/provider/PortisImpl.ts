import { ethers } from "ethers";
import Portis from "@portis/web3";
import { Provider } from "./Provider";

/**
 * A provider implementation using Portis
 */
export class PortisImpl implements Provider {
    // Unique instance for this provider implementation
    public static currentInstance: Provider;

    private rawProvider;

    // TODO Remove all hardcoded stuff
    constructor() {
        PortisImpl.currentInstance = this;

        let portis = new Portis('15ce62b0-b226-4e6f-9f8d-abbdf8f2cda2', {
            nodeUrl: 'https://matic-testnet-archive-rpc.bwarelabs.com',
            chainId: '80001',
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