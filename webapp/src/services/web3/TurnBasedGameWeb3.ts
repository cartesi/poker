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
    private static readonly ATTEMPT_INTERVAL = 1000;

    gameIndex: number;

    gameContract: TurnBasedGameContract;
    loggerContract: LoggerContract;

    turnDataQueue: Array<any>;
    onTurnOverReceivedResolvers: Array<(any) => any>;

    claimedResult: any;
    onResultClaimReceived: (any) => any;
    onGameOverReceived: (any) => any;

    onGameChallengeReceived: (string) => any;
    onVerificationUpdate: (VerificationState, string) => any;

    constructor(gameIndex: number) {
        this.gameIndex = gameIndex;
        this.turnDataQueue = [];
        this.onTurnOverReceivedResolvers = [];
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

        // sets up listener for GameResultClaimed event
        const gameResultClaimedFilter = gameContextContract.filters.GameResultClaimed(this.gameIndex, null, null);
        gameContextContract.on(gameResultClaimedFilter, this.onClaimResult.bind(this));

        // sets up listener for GameEnd event
        const gameEndFilter = gameContextContract.filters.GameOver(this.gameIndex, null);
        gameContextContract.on(gameEndFilter, this.onGameEnd.bind(this));
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
                    await new Promise(resolve => setTimeout(resolve, TurnBasedGameWeb3.ATTEMPT_INTERVAL));
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
        return new Promise<string>(async (resolve) => {
            await this.initWeb3();
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

    //
    // CLAIM RESULT HANDLING
    //

    onClaimResult(gameIndex, claimedResult, claimer) {
        this.claimedResult = claimedResult;

        if (this.onResultClaimReceived) {
            this.onResultClaimReceived(claimedResult);
        }
    }
    claimResult(claimedResult: any): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let tx;
            this.claimedResult = claimedResult;
            await this.initWeb3();
            try {
                tx = await this.gameContract.claimResult(this.gameIndex, claimedResult);
                console.log(
                    `Result was claimed for game '${this.gameIndex}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})`
                );
            } catch (error) {
                console.error("Error during claim result: " + error);
            }
            if (tx) {
                resolve();
            } else {
                reject();
            }
        });
    }
    receiveResultClaimed(): Promise<any> {
        return new Promise<any>((resolve: (any) => any) => {
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
        return new Promise<void>(async (resolve, reject) => {
            await this.initWeb3();
            try {
                await this.gameContract.confirmResult(this.gameIndex);
                console.log(
                    `Result was confirmed for game '${this.gameIndex}'`
                );
                resolve();
            } catch (error) {
                console.error("Error during confirm result: " + error);
                reject();
            }
        });
    }
    receiveGameOver(): Promise<any> {
        return new Promise<any>((resolve) => {
            this.onGameOverReceived = resolve;
        });
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
