import { Provider } from "./Provider";

declare let window: any;

/**
 * A provider implementation using Metamask
 */
export class MetamaskProvider implements Provider {
    // Unique instance for this provider implementation
    public static currentInstance: Provider;

    private rawProvider;

    constructor() {
        MetamaskProvider.currentInstance = this;
        this.rawProvider = window.ethereum;
    }

    getRawProvider(): any {
        return this.rawProvider;
    }

    isWeb3Provider(): boolean {
        return true;
    }
}