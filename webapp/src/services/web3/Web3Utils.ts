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
        return ethers.utils.toUtf8Bytes(JSON.stringify(jsObject));
    }

    /**
     * Checks if the two provided addresses are equal.
     * 
     * @param address1 
     * @param address2 
     * @returns true if they are equal, false otherwise
     */
    public static compareAddresses(address1: string, address2: string): boolean {
        // uses hexlify to avoid issues with uppercase vs lowercase hex representations
        address1 = address1 ? ethers.utils.hexlify(address1) : address1;
        address2 = address2 ? ethers.utils.hexlify(address2) : address2;
        return address1 == address2;
    }
}
