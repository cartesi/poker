import { Provider } from "./Provider";

export class MetamaskImpl implements Provider {
    init(): void {
        throw new Error("Method not implemented.");
    }
    showSetupUI(): void {
        throw new Error("Method not implemented.");
    }
    getAccounts() {
        throw new Error("Method not implemented.");
    }
    getInstance(): Provider {
        throw new Error("Method not implemented.");
    }
    getRawProvider(): any {
        throw new Error("Method not implemented.");
    }
    getWrapableProvider(): any {
        throw new Error("Method not implemented.");
    }
    isWeb3Provider(): boolean {
        return true;
    }
    onActiveWalletChanged(walletChangeHandler: (any: any) => void): void {
        throw new Error("Method not implemented.");
    }
}