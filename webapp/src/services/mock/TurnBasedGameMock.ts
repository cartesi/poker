import { VerificationState } from "../Game";
import { TurnBasedGame } from "../TurnBasedGame";

/**
 * TurnBasedGame mock implementation
 *
 * Expects to be connected to another instance of TurnBasedGameMock
 */
export class TurnBasedGameMock implements TurnBasedGame {
    other: TurnBasedGameMock;
    turnDataQueue: Array<any>;
    onTurnOverReceivedResolvers: Array<(any) => any>;

    claimedResult: any;
    onResultClaimReceived: (any) => any;
    onGameOverReceived: (any) => any;

    onGameChallengeReceived: (string) => any;
    onVerificationUpdate: (VerificationState, string) => any;

    constructor() {
        this.turnDataQueue = [];
        this.onTurnOverReceivedResolvers = [];
    }

    connect(other: TurnBasedGameMock) {
        this.other = other;
        other.other = this;
    }

    // turn submission
    submitTurn(data: Uint8Array): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            try {
                this.other.turnDataQueue.push(data);
                resolve(data);
                this.other.dispatchTurn();
            } catch (error) {
                reject(error);
            }
        });
    }

    receiveTurnOver() {
        return new Promise<Uint8Array>((resolve) => {
            this.onTurnOverReceivedResolvers.push(resolve);
            this.dispatchTurn();
        });
    }
    dispatchTurn() {
        const data = this.turnDataQueue.shift();
        if (!data) return;
        const resolve = this.onTurnOverReceivedResolvers.shift();
        if (!resolve) {
            this.turnDataQueue.unshift(data);
            return;
        }
        setTimeout(() => {
            resolve(data);
            this.dispatchTurn();
        }, 10);
    }
    //
    // CLAIM RESULT HANDLING
    //
    onClaimResult(gameIndex, claimedResult, claimer) {
        // set state
        this.claimedResult = claimedResult;
        // call listener
        if (this.onResultClaimReceived) {
            this.onResultClaimReceived(claimedResult);
        }
    }
    claimResult(claimedResult: any): Promise<void> {
        return new Promise(async (resolve) => {
            this.claimedResult = claimedResult;
            resolve();
            this.other.onClaimResult(null, claimedResult, null);
        });
    }
    receiveResultClaimed() {
        return new Promise<any>((resolve) => {
            this.onResultClaimReceived = resolve;
        });
    }
    //
    // CONFIRM RESULT AND GAME END HANDLING
    //
    onGameEnd(gameIndex, confirmedResult) {
        if (this.onGameOverReceived) {
            this.onGameOverReceived(confirmedResult);
        }
    }
    confirmResult(): Promise<void> {
        return new Promise<void>((resolve) => {
            resolve();
            this.onGameEnd(null, this.claimedResult);
            this.other.onGameEnd(null, this.claimedResult);
        });
    }
    receiveGameOver(): Promise<any> {
        return new Promise<any>((resolve) => {
            this.onGameOverReceived = resolve;
        });
    }

    // challenge and verification
    onGameChallenged(gameIndex, msg) {
        if (this.onGameChallengeReceived) {
            this.onGameChallengeReceived(msg);
        }
    }
    challengeGame(msg: string): Promise<void> {
        return new Promise<void>((resolve) => {
            resolve();
            this.onGameChallenged(null, msg);
            this.other.onGameChallenged(null, msg);
            // TODO: move triggerVerification and other logic here
        });
    }
    receiveGameChallenged(): Promise<any> {
        return new Promise<any>((resolve) => {
            this.onGameChallengeReceived = resolve;
        });
    }
    receiveVerificationUpdate(): Promise<[VerificationState, string]> {
        return new Promise<any>((resolve) => {
            this.onVerificationUpdate = resolve;
        });
    }
    applyVerificationResult(): Promise<any> {
        return new Promise<void>((resolve) => {
            resolve();
            // TODO: compute a result considering that the cheater should lose everything
            this.onGameEnd(null, this.claimedResult);
            this.other.onGameEnd(null, this.claimedResult);
        });
    }
}
