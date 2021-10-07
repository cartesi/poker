import { ServiceConfig, ServiceType, ServiceImpl } from "./ServiceConfig";
import { TurnBasedGameMock } from "./mock/TurnBasedGameMock";
import { TurnBasedGameWeb3 } from "./web3/TurnBasedGameWeb3";
import { BigNumber } from "ethers";
import { VerificationState } from "./Game";

export interface TurnBasedGame {
    // turn submission
    submitTurn(data: Uint8Array): Promise<Uint8Array>;
    receiveTurnOver(): Promise<Uint8Array>;

    // result claim and confirmation
    claimResult(data: Array<BigNumber>): Promise<void>;
    receiveResultClaimed(): Promise<Array<BigNumber>>;
    confirmResult(): Promise<void>;
    receiveGameOver(): Promise<Array<BigNumber>>;

    // challenge and verification
    challengeGame(msg: string): Promise<void>;
    receiveGameChallenged(): Promise<string>;
    receiveVerificationUpdate(): Promise<[VerificationState, string]>;
    applyVerificationResult(): Promise<void>;
}

export class TurnBasedGameFactory {
    /**
     * Creates a new Transport instance based on service configuration
     *
     * @returns the Transport instance
     */
    public static create(gameIndex: number): TurnBasedGame {
        const impl = ServiceConfig.get(ServiceType.Transport);
        if (impl === ServiceImpl.Mock) {
            // mock TurnBasedGame
            return new TurnBasedGameMock();
        } else if (impl == ServiceImpl.Web3) {
            // web3 TurnBasedGame
            return new TurnBasedGameWeb3(gameIndex);
        } else {
            // unknown implementation configured
            throw `Unknown transport configuration '${impl}'!`;
        }
    }
}
