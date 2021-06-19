import { ServiceConfig, ServiceType, ServiceImpl } from "./ServiceConfig";
import { OnboardingMock } from "./mock/OnboardingMock";
import { OnboardingWeb3 } from "./web3/OnboardingWeb3";

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
            OnboardingWeb3.start(onChange);
        } else {
            // unknown implementation configured
            throw `Unknown transport configuration '${impl}'!`;
        }
    }
}
