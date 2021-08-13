import { ServiceConfig, ServiceType, ServiceImpl } from "./ServiceConfig";
import { OnboardingMock } from "./mock/OnboardingMock";
import { OnboardingPortis } from "./web3/OnboardingPortis";
import { OnboardingMetamask } from "./web3/OnboardingMetamask";
import { ProviderImpl } from "./web3/provider/Provider";

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

    public static startWeb3Onboarding(onChange) {
        let providerType: ProviderImpl = ServiceConfig.currentInstance.providerType;
        if (providerType == ProviderImpl.Portis) {
            OnboardingPortis.start(onChange);
        } else if (providerType == ProviderImpl.Metamask) {
            OnboardingMetamask.start(onChange);
        } else {
            throw new Error("Unsupported web3 provider.");
        }
    }
}