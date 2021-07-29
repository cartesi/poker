import { ServiceConfig, ServiceType, ServiceImpl } from "./ServiceConfig";
import { TurnBasedGameMock } from "./mock/TurnBasedGameMock";
import { TurnBasedGameWeb3 } from "./web3/TurnBasedGameWeb3";
import { ethers } from "ethers";
// import { TurnBasedGameWeb3 } from "./web3/TurnBasedGameWeb3";

export interface TurnBasedGame {
    // turn submission
    submitTurn(data: string): Promise<string>;
    receiveTurnOver(): Promise<string>;

    // result claim and confirmation
    claimResult(data: Array<ethers.BigNumber>): Promise<void>;
    receiveResultClaimed(): Promise<Array<ethers.BigNumber>>;
    confirmResult(): Promise<void>;
    receiveGameOver(): Promise<Array<ethers.BigNumber>>;

    // challenge and verification
    challengeGame(msg: string, onGameChallenged?: (string) => any);
    receiveGameChallenged(onGameChallengeReceived: (string) => any);
    receiveVerificationUpdate(onVerificationUpdate?: (VerificationState, string) => any);
    applyVerificationResult(onApplyResultSent: (any) => any);
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
