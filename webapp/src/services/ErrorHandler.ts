export class ErrorHandler {
    public static readonly ATTEMPT_INTERVAL = 5000;
    
    private static onError: (index: number, title: string, error: any) => any = () => {};

    private static nextExecIndex = 0;
    private static executions = {};

    /**
     * Wraps a given function call applying a standard procedure of repeatedly trying with a
     * configures interval, reporting any failures/errors.
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
                console.log(`Error while executing ${title} (exec index '${execIndex}'): ${JSON.stringify(error)}`);
                ErrorHandler.onError(execIndex, title, error);
                await new Promise((resolve) => setTimeout(resolve, ErrorHandler.ATTEMPT_INTERVAL));
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
     * Interrupts execution identified by the provided index
     * @param index execution index to interrupt
     */
    public static interrupt(index: number) {
        if (index === undefined) {
            return;
        }
        console.log(`Interrupting error handling for exec index '${index}'`);
        delete this.executions[index];
    }
}
