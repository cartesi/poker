export class ErrorHandler {
    public static readonly ATTEMPT_INTERVAL = 5000;
    
    private static onError: (title: string, error: any) => any = () => {};

    /**
     * Wraps a given function call applying a standard procedure of repeatedly trying with a
     * configures interval, reporting any failures/errors.
     *
     * @param title title of the execution, to be used in error messages and logging
     * @param exec function to be executed
     */
     public static async execute(title: string, exec: () => Promise<void>) {
        while (true) {
            try {
                await exec();
                break;
            } catch (error) {
                console.log(`Error while executing ${title}: ${JSON.stringify(error)}`);
                ErrorHandler.onError(title, error);
                await new Promise((resolve) => setTimeout(resolve, ErrorHandler.ATTEMPT_INTERVAL));
            }
        }
    }

    /**
     * Defines procedure to be executed when an error is reported.
     * 
     * @param onError callback that receives a title and an error object
     */
    public static setOnError(onError: (title:string, error: any) => any) {
        ErrorHandler.onError = onError;
    }
}
