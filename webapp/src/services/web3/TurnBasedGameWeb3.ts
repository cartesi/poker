import { ethers } from "ethers";
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

/**
 * TurnBasedGame web3 implementation
 *
 * Expects webapp to be connected to the blockchain
 */
export class TurnBasedGameWeb3 implements TurnBasedGame {
    private static readonly MAX_ATTEMPTS = 5;
    private static readonly ATTEMPT_INTERVAL = 3000;

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

    /**
     * Returns application player's address, which may be compared with contract information
     * @returns a 20-byte hex string representing the player's address
     */
    async getPlayerAddress(): Promise<string> {
        return await this.gameContract.signer.getAddress();
    }

    /**
     * Sends a transaction wrapping a given tx function call and applying a standard procedure of trying N times
     * before failing.
     * 
     * @param title title of the transaction being made, to be used in error messages and logging
     * @param txCall a function that submits a Web3 transaction
     */
    async sendTransaction(title: string, txCall: () => void) {
        // submission will be attempted several times because sometimes the RPC endpoint is a little delayed
        // - we may nevertheless fail immediately (without retrying) depending on the error
        let lastError;
        for (let i = 0; i < TurnBasedGameWeb3.MAX_ATTEMPTS; i++) {
            try {
                await txCall();
                lastError = undefined;
                break;
            } catch (error) {
                lastError = error;
                if (error && error.message && error.message.includes && error.message.includes("MetaMask Tx Signature")) {
                    // user rejected transaction: fail immediately
                    // TODO: can we trust some error code instead of the MetaMask-specific error message?
                    break;
                }
                console.error(`${title}: error in attempt ${i + 1}/${TurnBasedGameWeb3.MAX_ATTEMPTS}`);
                await new Promise(resolve => setTimeout(resolve, TurnBasedGameWeb3.ATTEMPT_INTERVAL));
            }
        }
        if (lastError) {
            throw lastError;
        }
    }

    // TURN SUBMISSION
    async submitTurn(data: string): Promise<string> {
        await this.initWeb3();
        const payload = ethers.utils.toUtf8Bytes(data);

        await this.sendTransaction("submitTurn", async () => {
            const context = await this.gameContract.getContext(this.gameIndex);
            const turnIndex = context.turns.length;
            const tx = await this.gameContract.submitTurn(this.gameIndex, turnIndex, payload);
            console.log(
                `Submitted turn '${turnIndex}' for game '${this.gameIndex}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})`
            );
        });
        return data;
    }
    async onTurnOver(gameIndex, turnIndex, turn) {
        await this.initWeb3();
        const player = await this.getPlayerAddress();
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
    async claimResult(claimedResult: any): Promise<void> {
        this.claimedResult = claimedResult;
        await this.initWeb3();

        await this.sendTransaction("claimResult", async () => {
            const tx = await this.gameContract.claimResult(this.gameIndex, claimedResult);
            console.log(
                `Result was claimed for game '${this.gameIndex}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})`
            );
        })
    }
    async onClaimResult(gameIndex, claimedResult, claimer) {
        const player = await this.getPlayerAddress();
        if (claimer == player) {
            // claimer is the player himself: ignore it
            return;
        }
        this.claimedResult = claimedResult;
        if (this.onResultClaimReceived) {
            this.onResultClaimReceived(claimedResult);
        }
    }
    receiveResultClaimed(): Promise<any> {
        return new Promise<any>((resolve: (any) => any) => {
            this.onResultClaimReceived = resolve;
        });
    }

    //
    // CONFIRM RESULT AND GAME END HANDLING
    //
    async confirmResult(): Promise<void> {
        await this.initWeb3();
        await this.sendTransaction("confirmResult", async () => {
            const tx = await this.gameContract.confirmResult(this.gameIndex);
            console.log(
                `Result was confirmed for game '${this.gameIndex}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})`
            );
        });
    }
    onGameEnd(gameIndex, confirmedResult) {
        if (this.onGameOverReceived) {
            this.onGameOverReceived(confirmedResult);
        }
    }
    receiveGameOver(): Promise<any> {
        return new Promise<any>((resolve) => {
            this.onGameOverReceived = resolve;
        });
    }

    //
    // CHALLENGE AND VERIFICATION
    //
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
