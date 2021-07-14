
export class Web3TestUtils {

    /**
     * Used to cause a wait until events arrive
     * 
     * @param delay Time in miliseconds
     * @returns Promise to be resolved
     */
    public static waitUntil(delay: number) {
        return new Promise<void>((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, delay);
        });
    }
}