import { ethers } from "ethers";
import { BigNumber } from "ethers";
import { TurnBasedGame } from "../TurnBasedGame";
import TurnBasedGameJson from "../../abis/TurnBasedGame.json";
import TurnBasedGameContextJson from "../../abis/TurnBasedGameContext.json";
import { TurnBasedGame as TurnBasedGameContract } from "../../types";
import { TurnBasedGame__factory } from "../../types";
import { TurnBasedGameContext__factory } from "../../types";
import LoggerJson from "../../abis/Logger.json";
import { Logger as LoggerContract } from "../../types";
import { Logger__factory } from "../../types";
import DescartesJson from "../../abis/Descartes.json";
import { DescartesInterface as DescartesContract } from "../../types";
import { DescartesInterface__factory as Descartes__factory } from "../../types";
import { ServiceConfig } from "../ServiceConfig";
import { ErrorHandler } from "../ErrorHandler";
import { VerificationState } from "../Game";

/**
 * TurnBasedGame web3 implementation
 *
 * Expects webapp to be connected to the blockchain
 */
export class TurnBasedGameWeb3 implements TurnBasedGame {
    gameIndex: number;

    descartesContract: DescartesContract;
    loggerContract: LoggerContract;
    gameContract: TurnBasedGameContract;
    gameContextContract: any;

    turnDataQueue: Array<any>;
    onTurnOverReceivedResolvers: Array<(any) => any>;

    claimedResult: any;
    onResultClaimReceived: (claimedResult: any) => any;
    onGameOverReceived: (confirmedResult: any) => any;

    descartesFinishedListener: (descartesIndexFinished: BigNumber, state: string) => void;
    onGameChallengeReceived: (msg: string) => any;
    onVerificationUpdate: (state: VerificationState, msg: string) => any;

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
        this.descartesContract = Descartes__factory.connect(DescartesJson.address, signer);
        this.loggerContract = Logger__factory.connect(LoggerJson.address, signer);
        this.gameContract = TurnBasedGame__factory.connect(TurnBasedGameJson.address, signer);
        const contextContract = TurnBasedGameContext__factory.connect(TurnBasedGameContextJson.address, signer);
        this.gameContextContract = contextContract.attach(this.gameContract.address);

        // cancels any current event listening
        this.gameContextContract.removeAllListeners();

        // sets up listener for TurnOver events for this game
        const turnOverFilter = this.gameContextContract.filters.TurnOver(this.gameIndex, null, null);
        this.gameContextContract.on(turnOverFilter, this.onTurnOver.bind(this));

        // sets up listener for GameResultClaimed event
        const gameResultClaimedFilter = this.gameContextContract.filters.GameResultClaimed(this.gameIndex, null, null);
        this.gameContextContract.on(gameResultClaimedFilter, this.onClaimResult.bind(this));

        // sets up listener for GameChallenged event
        const gameChallengedFilter = this.gameContextContract.filters.GameChallenged(this.gameIndex, null, null);
        this.gameContextContract.on(gameChallengedFilter, this.onGameChallenged.bind(this));

        // sets up listener for GameEnd event
        const gameEndFilter = this.gameContextContract.filters.GameOver(this.gameIndex, null);
        this.gameContextContract.on(gameEndFilter, this.onGameEnd.bind(this));
    }

    /**
     * Remove blockchain listeners.
     * This is especially useful to correctly finish the process for automated tests
     * using this service.
     */
    removeListeners() {
        this.gameContextContract.removeAllListeners();
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

        await ErrorHandler.execute("submitTurn", async () => {
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

        console.log(`Received turn '${turnIndex}' for game '${this.gameIndex}'`);

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
            let logEvents;
            await ErrorHandler.execute("LoggerQueryFilter", async () => {
                const filter = this.loggerContract.filters.MerkleRootCalculatedFromData(index, null, null, null);
                logEvents = await this.loggerContract.queryFilter(filter);
            });
            if (logEvents && logEvents.length && logEvents[0].args._data && logEvents[0].args._data.length) {
                dataBytes8 = dataBytes8.concat(logEvents[0].args._data);
            }
        }
        const data = ethers.utils.concat(dataBytes8);
        return data;
    }

    //
    // CLAIM RESULT HANDLING
    //
    async claimResult(claimedResult: any): Promise<void> {
        this.claimedResult = claimedResult;
        await this.initWeb3();

        await ErrorHandler.execute("claimResult", async () => {
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
        await ErrorHandler.execute("confirmResult", async () => {
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
    async challengeGame(msg: string): Promise<void> {
        await this.initWeb3();
        await ErrorHandler.execute("challengeGame", async () => {
            const tx = await this.gameContract.challengeGame(this.gameIndex);
            console.log(`Challenged game '${this.gameIndex}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})`);
        });
    }
    onGameChallenged(gameIndex, descartesIndex, author) {
        // turns off previous listener for DescartesFinished events, if there was one
        if (this.descartesFinishedListener) {
            this.descartesContract.off("DescartesFinished", this.descartesFinishedListener);
        }
        // creates listener based on provided `descartesIndex`
        this.descartesFinishedListener = function (descartesIndexFinished: BigNumber, state: string) {
            if (descartesIndexFinished.eq(descartesIndex)) {
                const stateStr = ethers.utils.toUtf8String(state);
                if (stateStr === "ConsensusResult") {
                    // result successfully computed: apply it
                    this.applyVerificationResult();
                } else {
                    // error computing result: try again
                    this.challengeGame(`Verification failed with state ${stateStr}`);
                }
            }
        };
        // sets up listener for DescartesFinished events
        this.descartesContract.on("DescartesFinished", this.descartesFinishedListener);
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
    async applyVerificationResult(): Promise<any> {
        await this.initWeb3();
        await ErrorHandler.execute("applyVerificationResult", async () => {
            const tx = await this.gameContract.applyVerificationResult(this.gameIndex);
            console.log(
                `Applying verification result for game '${this.gameIndex}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})`
            );
        });
    }
}
