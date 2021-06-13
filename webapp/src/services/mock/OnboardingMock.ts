export class OnboardingMock {
    /**
     * Starts user onboarding using mock impl
     */
    public static start(onChange) {
        onChange({
            label: "Connect to wallet",
            onclick: this.connect.bind(this),
            loading: false,
            error: false,
            ready: false,
        });
    }

    private static connect(onChange) {
        onChange({ label: "Connecting to wallet...", onclick: undefined, loading: true, error: false, ready: false });
        setTimeout(
            () =>
                onChange({
                    label: "Approve allowance for POKER tokens",
                    onclick: this.approve.bind(this),
                    loading: false,
                    error: false,
                    ready: false,
                }),
            2000
        );
    }

    private static approve(onChange) {
        onChange({ label: "Approving allowance...", onclick: undefined, loading: true, error: false, ready: false });
        setTimeout(
            () =>
                onChange({
                    label: "Connected to Mock Network",
                    onclick: undefined,
                    loading: false,
                    error: false,
                    ready: true,
                }),
            2000
        );
    }
}
