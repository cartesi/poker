export class ErrorHandler {
    private static readonly DEFAULT_ATTEMPT_INTERVAL = 5000;
    private static attemptInterval = ErrorHandler.DEFAULT_ATTEMPT_INTERVAL;

    private static onError: (index: number, title: string, error: any) => any = () => {};

    private static nextExecIndex = 0;
    private static executions = {};

    /**
     * Returns the interval to wait when each execution fails, before attempting it again.
     * @returns an amount of time in milliseconds
     */
    public static getAttemptInterval(): number {
        return this.attemptInterval;
    }

    /**
     * Defines the interval to wait when each execution fails, before attempting it again.
     * @param interval a positive number representing an amount of time in milliseconds
     */
    public static setAttemptInterval(interval: number): void {
        if (isNaN(interval) || interval <= 0) {
            throw `Attempt interval must be a positive number, but received '${interval}'`;
        }
        this.attemptInterval = interval;
    }

    /**
     * Wraps a given function call applying a standard procedure of repeatedly trying with a
     * configured interval, reporting any failures/errors.
     *
     * @param title title of the execution, to be used in error messages and logging
     * @param exec function to be executed
     */
    public static async execute(title: string, exec: () => Promise<void>) {
        const execIndex = this.nextExecIndex++;
        this.executions[execIndex] = exec;
        while (true) {
            if (!this.executions[execIndex]) {
                // interrupts execution if it is no longer in the executions list
                break;
            }
            try {
                await exec();
                delete this.executions[execIndex];
            } catch (error) {
                console.log(`Error while executing '${title}' (exec index '${execIndex}'): ${JSON.stringify(error)}`);
                ErrorHandler.onError(execIndex, title, error);
                await new Promise((resolve) => setTimeout(resolve, ErrorHandler.getAttemptInterval()));
            }
        }
    }

    /**
     * Defines procedure to be executed when an error is reported.
     *
     * @param onError callback that receives a title and an error object
     */
    public static setOnError(onError: (index: number, title: string, error: any) => any) {
        ErrorHandler.onError = onError;
    }

    /**
     * Interrupts execution identified by the provided index.
     * @param index execution index to interrupt
     */
    public static interrupt(index: number) {
        if (index === undefined) {
            return;
        }
        console.log(`Interrupting error handling for exec index '${index}'`);
        delete this.executions[index];
    }

    /**
     * Interrupts all current executions.
     */
     public static interruptAll() {
        console.debug(`Interrupting error handling for ALL executions`);
        this.executions = {};
    }
}
