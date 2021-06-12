import { OnboardingMock } from "./mock/OnboardingMock";
import { OnboardingWeb3 } from "./web3/OnboardingWeb3";

export class Onboarding {
    /**
     * Starts user onboarding
     */
    public static start(onChange) {
        if (window.location.search && window.location.search.includes("mock")) {
            OnboardingMock.start(onChange);
        } else {
            OnboardingWeb3.start(onChange);
        }
    }
}
