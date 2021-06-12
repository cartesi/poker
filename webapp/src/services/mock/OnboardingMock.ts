export class OnboardingMock {
    /**
     * Starts user onboarding using mock impl
     */
    public static start(onChange) {
        onChange({ label: "Connect to wallet", onclick: this.connect.bind(this), error: false, ready: false });
    }

    private static connect(onChange) {
        setTimeout(() =>
            onChange(
                {
                    label: "Approve allowance for POKER tokens",
                    onclick: this.approve.bind(this),
                    error: false,
                    ready: false,
                },
                2000
            )
        );
    }

    private static approve(onChange) {
        setTimeout(() =>
            onChange({ label: "Connected to Mock Network", onclick: undefined, error: false, ready: true }, 2000)
        );
    }
}
