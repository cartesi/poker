import { ServiceConfig, ServiceType, ServiceImpl } from "./ServiceConfig";
import { TurnBasedGameMock } from "./mock/TurnBasedGameMock";
import { TurnBasedGameWeb3 } from "./web3/TurnBasedGameWeb3";
import { BigNumber } from "ethers";
import { VerificationState } from "./Game";

export class TurnInfo {
    nextPlayer: number;
    playerStake: BigNumber;
    data: Uint8Array;
}

export interface TurnBasedGame {
    // turn submission
    submitTurn(info: TurnInfo): Promise<TurnInfo>;
    receiveTurnOver(): Promise<TurnInfo>;

    // result claim and confirmation
    claimResult(data: Array<BigNumber>): Promise<void>;
    receiveResultClaimed(): Promise<Array<BigNumber>>;
    confirmResult(): Promise<void>;
    receiveGameOver(): Promise<Array<BigNumber>>;

    // challenge and verification
    claimTimeout(): Promise<void>;
    challengeGame(msg: string): Promise<void>;
    receiveGameChallenged(): Promise<string>;
    receiveVerificationUpdate(): Promise<[VerificationState, string]>;
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
            // mock TurnBasedGame (assumes playerIndex=0, meaning that it is ALICE's instance)
            return new TurnBasedGameMock(gameIndex, 0);
        } else if (impl == ServiceImpl.Web3) {
            // web3 TurnBasedGame
            return new TurnBasedGameWeb3(gameIndex);
        } else {
            // unknown implementation configured
            throw `Unknown transport configuration '${impl}'!`;
        }
    }
}
