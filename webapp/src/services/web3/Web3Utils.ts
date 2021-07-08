import { ethers } from "ethers";

export class Web3Utils {

    /**
     * Converts a JavaScript Object to Uint8Array.
     * JSON -> String -> Uint8Array
     * 
     * @param jsObject JavaScript object to be converted
     * @returns converted object
     */
    public static toUint8Array(jsObject: Object): Uint8Array {
        return ethers.utils.toUtf8Bytes(
            JSON.stringify(jsObject));
    }
}
