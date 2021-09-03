import { Provider } from "./Provider";

export class MetamaskProvider implements Provider {
    getRawProvider(): any {
        throw new Error("Method not implemented.");
    }
    isWeb3Provider(): boolean {
        return true;
    }
}