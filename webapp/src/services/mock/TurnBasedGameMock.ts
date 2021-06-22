import { TurnBasedGame } from "../TurnBasedGame";

/**
 * TurnBasedGame mock implementation
 *
 * Expects to be connected to another instance of TurnBasedGameMock
 */
export class TurnBasedGameMock implements TurnBasedGame {
    other: TurnBasedGameMock;
    turnDataQueue: Array<any>;
    onTurnOverReceivedCallbacks: Array<(any) => any>;

    claimedResult: any;
    onResultClaimed: (any) => any;
    onResultClaimReceived: (any) => any;
    onResultConfirmed: (any) => any;
    onGameOverReceived: (any) => any;

    onGameChallengeReceived: (string) => any;
    onVerificationUpdate: (VerificationState, string) => any;

    constructor() {
        this.turnDataQueue = [];
        this.onTurnOverReceivedCallbacks = [];
    }

    connect(other: TurnBasedGameMock) {
        this.other = other;
        other.other = this;
    }

    // turn submission
    submitTurn(data: string, onTurnSubmitted?: (string) => any) {
        this.other.turnDataQueue.push(data);
        if (onTurnSubmitted) {
            onTurnSubmitted(data);
        }
        this.other.dispatchTurn();
    }
    receiveTurnOver(onTurnOverReceived: (string) => any) {
        this.onTurnOverReceivedCallbacks.push(onTurnOverReceived);
        this.dispatchTurn();
    }
    dispatchTurn() {
        const data = this.turnDataQueue.shift();
        if (!data) return;
        const callback = this.onTurnOverReceivedCallbacks.shift();
        if (!callback) {
            this.turnDataQueue.unshift(data);
            return;
        }
        callback(data);
        this.dispatchTurn();
    }

    // result claim and confirmation
    claimResult(data: any, onResultClaimed?: (any) => any) {
        this.claimedResult = data;
        this.other.claimedResult = data;
        if (onResultClaimed) {
            onResultClaimed(data);
        }
        if (this.other.onResultClaimReceived) {
            this.other.onResultClaimReceived(data);
        }
    }
    receiveResultClaimed(onResultClaimReceived: (any) => any) {
        this.onResultClaimReceived = onResultClaimReceived;
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
