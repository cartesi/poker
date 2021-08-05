import { ethers } from "ethers";

export class Web3Utils {
    private static readonly MAX_ATTEMPTS = 5;
    private static readonly ATTEMPT_INTERVAL = 3000;

    /**
     * Converts a JavaScript Object to Uint8Array.
     * JSON -> String -> Uint8Array
     *
     * @param jsObject JavaScript object to be converted
     * @returns converted object
     */
    public static toUint8Array(jsObject: Object): Uint8Array {
        return ethers.utils.toUtf8Bytes(JSON.stringify(jsObject));
    }

    /**
     * Sends a transaction wrapping a given tx function call and applying a standard procedure of trying N times
     * before failing.
     *
     * @param title title of the transaction being made, to be used in error messages and logging
     * @param txCall a function that submits a Web3 transaction
     */
    public static async sendTransaction(title: string, txCall: () => Promise<void>) {
        // submission will be attempted several times because sometimes the RPC endpoint is a little delayed
        // - we may nevertheless fail immediately (without retrying) depending on the error
        let lastError;
        for (let i = 0; i < Web3Utils.MAX_ATTEMPTS; i++) {
            try {
                await txCall();
                lastError = undefined;
                break;
            } catch (error) {
                lastError = error;
                if (
                    error &&
                    error.message &&
                    error.message.includes &&
                    error.message.includes("MetaMask Tx Signature")
                ) {
                    // user rejected transaction: fail immediately
                    // TODO: can we trust some error code instead of the MetaMask-specific error message?
                    break;
                }
                console.error(`${title}: error in attempt ${i + 1}/${Web3Utils.MAX_ATTEMPTS}`);
                await new Promise((resolve) => setTimeout(resolve, Web3Utils.ATTEMPT_INTERVAL));
            }
        }
        if (lastError) {
            throw lastError;
        }
    }
}
