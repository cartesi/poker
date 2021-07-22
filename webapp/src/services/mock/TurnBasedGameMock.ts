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
    onResultConfirmed: (any) => any;
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
    submitTurn(data: string) {
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
        return new Promise<string>((resolve) => {
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
        resolve(data);
        this.dispatchTurn();
    }

    // result claim and confirmation
    onClaimResult(gameIndex, claimedResult, claimer) {
        // set state
        this.claimedResult = claimedResult;
        this.other.claimedResult = claimedResult;
        // call listener
        if (this.other.onResultClaimReceived) {
            this.other.onResultClaimReceived(claimedResult);
        }
    }
    claimResult(claimedResult: any): Promise<void> {
        return new Promise(async (resolve) => {
            this.onClaimResult(null, claimedResult, null)
            resolve();
        });
    }
    receiveResultClaimed() {
        return new Promise<any>((resolve) => {
            this.onResultClaimReceived = resolve;
            this.other.onResultClaimReceived = resolve;
        });
    }
    confirmResult(onResultConfirmed?: (any) => any) {
        if (onResultConfirmed) {
            onResultConfirmed(this.claimedResult);
        }
        if (this.other.onGameOverReceived) {
            this.other.onGameOverReceived(this.claimedResult);
        }
    }
    receiveGameOver(onGameOverReceived: (any) => any) {
        this.onGameOverReceived = onGameOverReceived;
    }

    // challenge and verification
    challengeGame(msg: string, onGameChallenged?: (string) => any) {
        if (onGameChallenged) {
            onGameChallenged(msg);
        }
        if (this.other.onGameChallengeReceived) {
            this.other.onGameChallengeReceived(msg);
        }
        // TODO: move triggerVerification and other logic here
    }
    receiveGameChallenged(onGameChallengeReceived: (string) => any) {
        this.onGameChallengeReceived = onGameChallengeReceived;
    }
    receiveVerificationUpdate(onVerificationUpdate?: (VerificationState, string) => any) {
        this.onVerificationUpdate = onVerificationUpdate;
    }
    applyVerificationResult(onApplyResultSent: (any) => any) {
        if (onApplyResultSent) {
            onApplyResultSent(this.claimedResult);
        }
        if (this.other.onGameOverReceived) {
            this.other.onGameOverReceived(this.claimedResult);
        }
    }
}
