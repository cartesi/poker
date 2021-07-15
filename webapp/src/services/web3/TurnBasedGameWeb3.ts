import { BytesLike, ethers } from "ethers";
import { TurnBasedGame } from "../TurnBasedGame";
import TurnBasedGameJson from "../../abis/TurnBasedGame.json";
import TurnBasedGameContextJson from "../../abis/TurnBasedGameContext.json";
import { TurnBasedGame as TurnBasedGameContract } from "../../types";
import { TurnBasedGame__factory } from "../../types";
import { TurnBasedGameContext__factory } from "../../types";
import LoggerJson from "../../abis/Logger.json";
import { Logger as LoggerContract } from "../../types";
import { Logger__factory } from "../../types";
import { ServiceConfig } from "../ServiceConfig";

declare let window: any;

/**
 * TurnBasedGame web3 implementation
 *
 * Expects webapp to be connected to the blockchain
 */
export class TurnBasedGameWeb3 implements TurnBasedGame {
    private static readonly MAX_ATTEMPTS = 5;

    gameIndex: number;

    gameContract: TurnBasedGameContract;
    loggerContract: LoggerContract;

    turnDataQueue: Array<any>;
    onTurnOverReceivedCallbacks: Array<(any) => any>;

    claimedResult: any;
    onResultClaimed: (any) => any;
    onResultClaimReceived: (any) => any;
    onResultConfirmed: (any) => any;
    onGameOverReceived: (any) => any;

    onGameChallengeReceived: (string) => any;
    onVerificationUpdate: (VerificationState, string) => any;

    constructor(gameIndex: number) {
        this.gameIndex = gameIndex;
        this.turnDataQueue = [];
        this.onTurnOverReceivedCallbacks = [];
    }

    /**
     * Initializes connection to TurnBasedGame smart contracts
     * @returns
     */
    async initWeb3() {
        if (this.gameContract) {
            // already initialized
            return;
        }

        // retrieves signer (e.g., from metamask)
        const signer = ServiceConfig.getSigner();

        // connects to smart contracts
        this.loggerContract = Logger__factory.connect(LoggerJson.address, signer);
        this.gameContract = TurnBasedGame__factory.connect(TurnBasedGameJson.address, signer);
        const contextContract = TurnBasedGameContext__factory.connect(TurnBasedGameContextJson.address, signer);
        const gameContextContract = contextContract.attach(this.gameContract.address);

        // cancels any current event listening
        gameContextContract.removeAllListeners();

        // sets up listener for TurnOver events for this game
        const turnOverFilter = gameContextContract.filters.TurnOver(this.gameIndex, null, null);
        gameContextContract.on(turnOverFilter, this.onTurnOver.bind(this));

        // TODO: setup other listeners
    }

    // TURN SUBMISSION
    async submitTurn(data: string) {
        return new Promise(async (resolve, reject) => {
            await this.initWeb3();
            const payload = ethers.utils.toUtf8Bytes(data);
            let tx;
            // TODO: we try several times here for the time being, but a better procedure would be to throw the exception right away and let the UI decide what to do
            for (let i = 0; i < TurnBasedGameWeb3.MAX_ATTEMPTS; i++) {
                try {
                    const context = await this.gameContract.getContext(this.gameIndex);
                    const turnIndex = context.turns.length;
                    console.log(`turnIndex: ${turnIndex}`);
                    tx = await this.gameContract.submitTurn(this.gameIndex, turnIndex, payload);
                    console.log(
                        `Submitted turn for game '${this.gameIndex}' and index '${turnIndex}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})`
                    );
                    break;
                } catch (error) {
                    console.error(`Error submitting turn: attempt ${i + 1}/${TurnBasedGameWeb3.MAX_ATTEMPTS}`);
                }
            }
            if (tx) {
                resolve(data);
            } else {
                reject("Failure sending turn");
            }
        });
    }

    async onTurnOver(gameIndex, turnIndex, turn) {
        await this.initWeb3();
        const player = await this.gameContract.signer.getAddress();
        if (turn.player == player) {
            // turn sent by this player himself: ignore it
            return;
        }

        // TODO: check turnIndex sequence?

        // retrieves turn data from Logger
        const data = await this.getLoggerData(turn.dataLogIndices);

        // stores turn data in queue and checks for listeners
        this.turnDataQueue.push(data);
        this.dispatchTurn();
    }
    async receiveTurnOver() {
        return new Promise<any>(async (resolve) => {
            await this.initWeb3();
            this.onTurnOverReceivedCallbacks.push(resolve);
            this.dispatchTurn();
        });
    }
    dispatchTurn() {
        const data = this.turnDataQueue.shift();
        if (!data) return;
        const resolve = this.onTurnOverReceivedCallbacks.shift();
        if (!resolve) {
            this.turnDataQueue.unshift(data);
            return;
        }
        resolve(data);
        this.dispatchTurn();
    }
    async getLoggerData(logIndices: Array<number>) {
        let dataBytes8 = [];
        for (let index of logIndices) {
            const filter = this.loggerContract.filters.MerkleRootCalculatedFromData(index, null, null, null);
            const logEvents = await this.loggerContract.queryFilter(filter);
            if (logEvents && logEvents.length && logEvents[0].args._data && logEvents[0].args._data.length) {
                dataBytes8 = dataBytes8.concat(logEvents[0].args._data);
            }
        }
        const dataBytesPadded = ethers.utils.concat(dataBytes8);
        let dataBytes = dataBytesPadded;
        // removes Logger's padding
        // TODO: check if we should really remove Logger's padding or if engine should do deal with it
        // TODO: optimize by looking for the first non-'0' byte starting from the end
        const nullTerminationIndex = dataBytesPadded.indexOf(0);
        if (nullTerminationIndex != -1) {
            dataBytes = dataBytesPadded.subarray(0, dataBytesPadded.indexOf(0));
        }
        const data = ethers.utils.toUtf8String(dataBytes);
        return data;
    }

    // result claim and confirmation
    claimResult(data: any, onResultClaimed?: (any) => any) {
        this.claimedResult = data;
        // TODO: call smart contract
        if (onResultClaimed) {
            onResultClaimed(data);
        }
    }
    receiveResultClaimed(onResultClaimReceived: (any) => any) {
        this.onResultClaimReceived = onResultClaimReceived;
    }
    confirmResult(onResultConfirmed?: (any) => any) {
        // TODO: call smart contract
        if (onResultConfirmed) {
            onResultConfirmed(this.claimedResult);
        }
    }
    receiveGameOver(onGameOverReceived: (any) => any) {
        this.onGameOverReceived = onGameOverReceived;
    }

    // challenge and verification
    challengeGame(msg: string, onGameChallenged?: (string) => any) {
        // TODO: call smart contract
        if (onGameChallenged) {
            onGameChallenged(msg);
        }
    }
    receiveGameChallenged(onGameChallengeReceived: (string) => any) {
        this.onGameChallengeReceived = onGameChallengeReceived;
    }
    receiveVerificationUpdate(onVerificationUpdate?: (VerificationState, string) => any) {
        this.onVerificationUpdate = onVerificationUpdate;
    }
    applyVerificationResult(onApplyResultSent: (any) => any) {
        // TODO: call smart contract
        if (onApplyResultSent) {
            onApplyResultSent(this.claimedResult);
        }
    }
}
