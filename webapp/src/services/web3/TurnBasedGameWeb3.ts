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
import { Web3Utils } from "./Web3Utils";

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

    // TURN SUBMISSION
    async submitTurn(data: Uint8Array): Promise<Uint8Array> {
        await this.initWeb3();

        await Web3Utils.sendTransaction("submitTurn", async () => {
            const context = await this.gameContract.getContext(this.gameIndex);
            const turnIndex = context.turns.length;
            const tx = await this.gameContract.submitTurn(this.gameIndex, turnIndex, data);
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
        return new Promise<Uint8Array>(async (resolve) => {
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
        return dataBytes;
    }

    //
    // CLAIM RESULT HANDLING
    //
    async claimResult(claimedResult: any): Promise<void> {
        this.claimedResult = claimedResult;
        await this.initWeb3();

        await Web3Utils.sendTransaction("claimResult", async () => {
            const tx = await this.gameContract.claimResult(this.gameIndex, claimedResult);
            console.log(
                `Result was claimed for game '${this.gameIndex}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})`
            );
        });
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
        await Web3Utils.sendTransaction("confirmResult", async () => {
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
