import { ServiceConfig, ServiceType, ServiceImpl, OnboardingType } from "./ServiceConfig";
import { OnboardingMock } from "./mock/OnboardingMock";
import { OnboardingPortis } from "./web3/OnboardingPortis";
import { OnboardingMetamask } from "./web3/OnboardingMetamask";
import { OnboardingInternal as OnboardingInternal } from "./web3/OnboardingInternal";

export class Onboarding {
    /**
     * Starts user onboarding
     */
    public static start(onChange) {
        const impl = ServiceConfig.get(ServiceType.Transport);
        if (impl === ServiceImpl.Mock) {
            // mock onboarding
            OnboardingMock.start(onChange);
        } else if (impl == ServiceImpl.Web3) {
            // web3 onboarding
            Onboarding.startWeb3Onboarding(onChange);
        } else {
            // unknown implementation configured
            throw `Unknown transport configuration '${impl}'!`;
        }
    }

    private static startWeb3Onboarding(onChange) {
        let onboardingType = ServiceConfig.getOnboardingType();
        if (onboardingType == OnboardingType.Portis) {
            OnboardingPortis.start(onChange);
        } else if (onboardingType == OnboardingType.Metamask) {
            OnboardingMetamask.start(onChange);
        } else if (onboardingType == OnboardingType.Internal) {
            OnboardingInternal.start(onChange);
        } else {
            throw new Error("Unsupported web3 provider.");
        }
    }
}
