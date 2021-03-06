import { ServiceConfig, ServiceType, ServiceImpl, WalletWeb3Provider } from "./ServiceConfig";
import { OnboardingMock } from "./mock/OnboardingMock";
import { OnboardingPortis } from "./web3/OnboardingPortis";
import { OnboardingMetamask } from "./web3/OnboardingMetamask";
import { OnboardingInternal as OnboardingInternal } from "./web3/OnboardingInternal";

export class Onboarding {
    /**
     * Starts user onboarding
     */
    public static start(onChange, checkOnboardingActive) {
        const impl = ServiceConfig.get(ServiceType.Transport);
        if (impl === ServiceImpl.Mock) {
            // mock onboarding
            OnboardingMock.start(onChange);
        } else if (impl == ServiceImpl.Web3) {
            // web3 onboarding
            Onboarding.startWeb3Onboarding(onChange, checkOnboardingActive);
        } else {
            // unknown implementation configured
            throw `Unknown transport configuration '${impl}'!`;
        }
    }

    private static startWeb3Onboarding(onChange, checkOnboardingActive) {
        let provider = ServiceConfig.getWalletWeb3Provider();
        if (provider == WalletWeb3Provider.Portis) {
            OnboardingPortis.start(onChange, checkOnboardingActive);
        } else if (provider == WalletWeb3Provider.Metamask) {
            OnboardingMetamask.start(onChange, checkOnboardingActive);
        } else if (provider == WalletWeb3Provider.Internal) {
            OnboardingInternal.start(onChange, checkOnboardingActive);
        } else {
            throw new Error("Unsupported web3 provider.");
        }
    }
}
