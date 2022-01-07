import { ethers } from "ethers";
import { BigNumber } from "ethers";
import { TurnBasedGame, TurnInfo } from "../TurnBasedGame";
import TurnBasedGameJson from "../../abis/TurnBasedGame.json";
import TurnBasedGameContextJson from "../../abis/TurnBasedGameContext.json";
import { TurnBasedGame as TurnBasedGameContract } from "../../types";
import { TurnBasedGame__factory } from "../../types";
import { TurnBasedGameContext__factory } from "../../types";
import LoggerJson from "../../abis/Logger.json";
import { Logger as LoggerContract } from "@cartesi/logger/dist/src/types";
import { Logger__factory } from "@cartesi/logger/dist/src/types";
import DescartesJson from "../../abis/Descartes.json";
import { Descartes as DescartesContract } from "@cartesi/descartes-sdk/dist/src/types";
import { Descartes__factory } from "@cartesi/descartes-sdk/dist/src/types";
import { ServiceConfig } from "../ServiceConfig";
import { ErrorHandler } from "../ErrorHandler";
import { VerificationState } from "../Game";
import { Web3Utils } from "./Web3Utils";

/**
 * TurnBasedGame web3 implementation
 *
 * Expects webapp to be connected to the blockchain
 */
export class TurnBasedGameWeb3 implements TurnBasedGame {
    descartesContract: DescartesContract;
    loggerContract: LoggerContract;
    gameContract: TurnBasedGameContract;
    gameContextContract: any;

    latestTurnIndex: number;
    turnInfoQueue: Array<any>;
    onTurnOverReceivedResolvers: Array<(any) => any>;

    claimedResult: any;
    onResultClaimReceived: (claimedResult: any) => any;
    onGameOverReceived: (confirmedResult: any) => any;

    descartesListeners: object = {};
    onGameChallengeReceived: (msg: string) => any;
    onVerificationUpdate: (update: [VerificationState, string]) => any;

    constructor(private gameIndex: BigNumber) {
        this.turnInfoQueue = [];
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
        const turnOverFilter = this.gameContextContract.filters.TurnOver(this.gameIndex);
        this.gameContextContract.on(turnOverFilter, this.onTurnOver.bind(this));

        // sets up listener for GameResultClaimed event
        const gameResultClaimedFilter = this.gameContextContract.filters.GameResultClaimed(this.gameIndex);
        this.gameContextContract.on(gameResultClaimedFilter, this.onClaimResult.bind(this));

        // sets up listener for GameChallenged event
        const gameChallengedFilter = this.gameContextContract.filters.GameChallenged(this.gameIndex);
        this.gameContextContract.on(gameChallengedFilter, this.onGameChallenged.bind(this));

        // sets up listener for GameEnd event
        const gameEndFilter = this.gameContextContract.filters.GameOver(this.gameIndex);
        this.gameContextContract.on(gameEndFilter, this.onGameEnd.bind(this));
    }

    /**
     * Remove blockchain listeners.
     * This is especially useful to correctly finish the process for automated tests
     * using this service.
     */
    removeListeners() {
        if (this.descartesContract) {
            this.descartesContract.removeAllListeners();
        }
        if (this.gameContextContract) {
            this.gameContextContract.removeAllListeners();
        }
    }

    // TURN SUBMISSION
    async submitTurn(info: TurnInfo): Promise<TurnInfo> {
        await this.initWeb3();

        await ErrorHandler.execute("submitTurn", async () => {
            const context = await this.gameContract.getContext(this.gameIndex);
            const turnIndex = context.turns.length;
            // defines nextPlayer address
            // - if nextPlayer index is valid, uses corresponding player's address
            // - otherwise, uses address zero (no nextPlayer specified)
            let nextPlayerAddress = ethers.constants.AddressZero;
            if (info.nextPlayer >= 0 && info.nextPlayer < context.players.length) {
                nextPlayerAddress = context.players[info.nextPlayer];
            }
            // submits turn
            const tx = await this.gameContract.submitTurn(
                this.gameIndex,
                turnIndex,
                nextPlayerAddress,
                info.playerStake,
                info.data
            );
            console.log(
                `Submitted turn '${turnIndex}' for game '${this.gameIndex}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})`
            );
        });
        return info;
    }
    async onTurnOver(gameIndex, turnIndex, author, turn) {
        await this.initWeb3();
        turnIndex = BigNumber.from(turnIndex).toNumber();
        if (this.latestTurnIndex !== undefined && turnIndex < this.latestTurnIndex) {
            // turn has already been processed: ignore it
            console.log(
                `Ignoring turn '${turnIndex}' because it has already been processed (lastTurnIndex = '${this.latestTurnIndex}')`
            );
            return;
        }
        this.latestTurnIndex = turnIndex;
        const player = await this.getPlayerAddress();
        if (turn.player == player) {
            // turn sent by this player himself: ignore it
            return;
        }

        console.log(`Received turn '${turnIndex}' for game '${this.gameIndex}'`);

        // retrieves turn data from Logger
        const data = await this.getLoggerData(turn.dataLogIndices);

        // retrieves index of turn's declared nextPlayer
        const context = await this.getGameContext();
        let nextPlayerIndex = -1;
        if (turn.nextPlayer == player) {
            // next turn should be submitted by the player himself
            nextPlayerIndex = await this.getPlayerIndex(context);
        } else if (turn.nextPlayer != ethers.constants.AddressZero) {
            // next turn is defined and is not the player: check if it's really the opponent
            const opponentIndex = await this.getOpponentIndex(context);
            const opponentAddress = await this.getGamePlayerAddress(context, opponentIndex);
            if (turn.nextPlayer == opponentAddress) {
                nextPlayerIndex = opponentIndex;
            }
        }

        // stores turn info in queue and checks for listeners
        const turnInfo = { data, nextPlayer: nextPlayerIndex, playerStake: turn.playerStake };
        this.turnInfoQueue.push(turnInfo);
        this.dispatchTurn();
    }
    async receiveTurnOver() {
        return new Promise<TurnInfo>(async (resolve) => {
            await this.initWeb3();
            // checks for TurnOver events that may have been missed
            await ErrorHandler.execute("checkTurnOverEvents", async () => {
                const context = await this.gameContract.getContext(this.gameIndex);
                if (context.turns && context.turns.length) {
                    const startingPoint = this.latestTurnIndex === undefined ? 0 : this.latestTurnIndex + 1;
                    for (let i = startingPoint; i < context.turns.length; i++) {
                        const turn = context.turns[i];
                        await this.onTurnOver(this.gameIndex, i, turn.player, turn);
                    }
                }
            });
            this.onTurnOverReceivedResolvers.push(resolve);
            this.dispatchTurn();
        });
    }
    dispatchTurn() {
        const turnInfo = this.turnInfoQueue.shift();
        if (!turnInfo) return;
        const resolve = this.onTurnOverReceivedResolvers.shift();
        if (!resolve) {
            this.turnInfoQueue.unshift(turnInfo);
            return;
        }
        resolve(turnInfo);
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
    async claimTimeout(): Promise<void> {
        await this.initWeb3();
        await ErrorHandler.execute("claimTimeout", async () => {
            const isActive = await this.gameContract.isActive(this.gameIndex);
            if (!isActive) {
                // game is no longer active: ignore
                return;
            }
            const context = await this.gameContract.getContext(this.gameIndex);
            if (context.isDescartesInstantiated) {
                // game is under verification: ignore
                return;
            }
            const tx = await this.gameContract.claimTimeout(this.gameIndex);
            console.log(
                `Claimed opponent timeout for game '${this.gameIndex}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})`
            );
        });
    }
    async challengeGame(msg: string): Promise<void> {
        await this.initWeb3();
        await ErrorHandler.execute("challengeGame", async () => {
            const isActive = await this.gameContract.isActive(this.gameIndex);
            if (!isActive) {
                // game is no longer active: ignore
                return;
            }
            const context = await this.gameContract.getContext(this.gameIndex);
            if (context.isDescartesInstantiated) {
                // game verification has already been requested: check the current Descartes state
                const state = await this.descartesContract.getCurrentState(context.descartesIndex);
                if (!this.hasDescartesFinishedInError(state)) {
                    // Descartes has not finished with an error: ignore new challenge request
                    return;
                }
            }
            const tx = await this.gameContract.challengeGame(this.gameIndex, msg);
            console.log(`Challenged game '${this.gameIndex}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})`);
        });
    }
    onGameChallenged(gameIndex: BigNumber, descartesIndex: BigNumber, author?: string, message?: string) {
        console.log(
            `Received 'GameChallenged' event for game '${gameIndex}' from '${author}' with message '${message}', triggering Descartes computation '${descartesIndex}'`
        );
        if (this.onGameChallengeReceived) {
            this.onGameChallengeReceived(message);
        }

        // turns off previous listeners for Descartes events, if there were any
        for (let eventName in this.descartesListeners) {
            this.descartesContract.off(eventName, this.descartesListeners[eventName]);
        }

        // builds listeners for Descartes events targeting this specific challenge
        this.descartesListeners = this.buildDescartesListeners(descartesIndex, message);

        // sets up listeners on Descartes contract
        for (let eventName in this.descartesListeners) {
            this.descartesContract.on(eventName, this.descartesListeners[eventName]);
        }

        // if Descartes started before listeners were in place, emits STARTED notification
        if (this.onVerificationUpdate) {
            try {
                this.descartesContract.getCurrentState(descartesIndex);
                // no exception means that the Descartes computation was instantiated: notify that verification has already started
                this.onVerificationUpdate([VerificationState.STARTED, message]);
            } catch (error) {
                // exception means that Descartes instance is not available yet: that's ok, the Descartes listeners will take care of it
            }
        }
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
    async applyVerificationResult(): Promise<boolean> {
        let executed = false;
        await this.initWeb3();
        await ErrorHandler.execute("applyVerificationResult", async () => {
            const isActive = await this.gameContract.isActive(this.gameIndex);
            if (!isActive) {
                // game is no longer active: ignore
                return;
            }
            const context = await this.gameContract.getContext(this.gameIndex);
            if (context.isDescartesInstantiated) {
                // game verification was indeed requested: check the current Descartes state
                const state = await this.descartesContract.getCurrentState(context.descartesIndex);
                if (!this.hasDescartesFinishedSuccessfully(state)) {
                    // Descartes has not finished successfully yet: ignore apply verification request
                    return;
                }
            }
            const tx = await this.gameContract.applyVerificationResult(this.gameIndex);
            console.log(
                `Applying verification result for game '${this.gameIndex}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})`
            );
            executed = true;
        });
        return executed;
    }

    buildDescartesListeners(descartesIndex: BigNumber, message?: string): object {
        const self = this;
        const listeners = {};

        listeners["DescartesCreated"] = function (descartesIndexEvent: BigNumber) {
            if (descartesIndexEvent.eq(descartesIndex)) {
                console.log(`Received 'DescartesCreated' event for Descartes computation '${descartesIndex}'`);
                if (self.onVerificationUpdate) {
                    self.onVerificationUpdate([VerificationState.STARTED, message]);
                }
            }
        };

        listeners["ClaimSubmitted"] = function (descartesIndexEvent: BigNumber) {
            if (descartesIndexEvent.eq(descartesIndex)) {
                console.log(`Received 'ClaimSubmitted' event for Descartes computation '${descartesIndex}'`);
                if (self.onVerificationUpdate) {
                    self.onVerificationUpdate([VerificationState.RESULT_SUBMITTED, message]);
                }
            }
        };

        listeners["Confirmed"] = function (descartesIndexEvent: BigNumber) {
            if (descartesIndexEvent.eq(descartesIndex)) {
                console.log(`Received 'Confirmed' event for Descartes computation '${descartesIndex}'`);
                if (self.onVerificationUpdate) {
                    self.onVerificationUpdate([VerificationState.RESULT_CONFIRMED, message]);
                }
            }
        };

        listeners["ChallengeStarted"] = function (descartesIndexEvent: BigNumber) {
            if (descartesIndexEvent.eq(descartesIndex)) {
                console.log(`Received 'ChallengeStarted' event for Descartes computation '${descartesIndex}'`);
                if (self.onVerificationUpdate) {
                    self.onVerificationUpdate([VerificationState.RESULT_CHALLENGED, message]);
                }
            }
        };

        listeners["DescartesFinished"] = async function (descartesIndexEvent: BigNumber, state: string) {
            if (descartesIndexEvent.eq(descartesIndex)) {
                console.log(`Received 'DescartesFinished' event for Descartes computation '${descartesIndex}'`);
                let verificationState: VerificationState;
                if (self.hasDescartesFinishedSuccessfully(state)) {
                    // result successfully computed: apply it
                    verificationState = VerificationState.ENDED;
                    await self.applyVerificationResult();
                } else {
                    // error computing result: try again
                    verificationState = VerificationState.ERROR;
                    const stateStr = ethers.utils.toUtf8String(state);
                    await self.challengeGame(`Verification failed with state ${stateStr}`);
                }
                if (self.onVerificationUpdate) {
                    self.onVerificationUpdate([verificationState, message]);
                }
            }
        };

        return listeners;
    }

    /**
     * Returns application player's index considering a game context
     * @param context a game context
     * @returns an index value of 0 or 1
     */
    async getPlayerIndex(context: any): Promise<number> {
        return (await this.isSignerPlayer0(context)) ? 0 : 1;
    }

    /**
     * Returns application player's opponent index considering this instance's game context
     * @param context a game context
     * @returns an index value of 0 or 1
     */
    async getOpponentIndex(context: any): Promise<number> {
        return (await this.isSignerPlayer0(context)) ? 1 : 0;
    }

    /**
     * Returns whether a given Descartes state indicates that it has finished successfully
     * @returns true if Descartes has finished successfully, false otherwise
     */
    private hasDescartesFinishedSuccessfully(state: string): boolean {
        const stateStr = ethers.utils.toUtf8String(state);
        if (
            stateStr.startsWith("ConsensusResult") ||
            stateStr.startsWith("ClaimerWon") ||
            stateStr.startsWith("ChallengerWon")
        ) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Returns whether a given Descartes state indicates that it has finished in error
     * @returns true if Descartes has finished successfully, false otherwise
     */
     private hasDescartesFinishedInError(state: string): boolean {
        const stateStr = ethers.utils.toUtf8String(state);
        if (
            stateStr.startsWith("ClaimerMissedDeadline") ||
            stateStr.startsWith("ProviderMissedDeadline") ||
            stateStr.startsWith("Unrecognized state")
        ) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Returns application player's address, which may be compared with contract information
     * @returns a 20-byte hex string representing the player's address
     */
    private async getPlayerAddress(): Promise<string> {
        await this.initWeb3();
        return await this.gameContract.signer.getAddress();
    }

    /**
     * Retrieves the updated game context for this instance's game from the blockchain.
     * @returns an object as retrieved by `gameContract.getContext`
     */
    async getGameContext(): Promise<any> {
        await this.initWeb3();
        let context;
        await ErrorHandler.execute("getGameContext", async () => {
            context = await this.gameContract.getContext(this.gameIndex);
        });
        return context;
    }

    /**
     * Returns the account address corresponding to a given game player's index.
     * @param context a game context
     * @returns a 20-byte hex string representing the player's opponent address
     */
    private getGamePlayerAddress(context: any, index: number): string {
        if (context.players && index >= 0 && index < context.players.length) {
            return context.players[index];
        } else {
            return ethers.constants.AddressZero;
        }
    }

    /**
     * Returns whether the application user/signer corresponds to the given context's player index 0
     * @param context a game context
     * @returns true if the signer corresponds to player0, false otherwise
     */
    private async isSignerPlayer0(context: any): Promise<boolean> {
        await this.initWeb3();
        let signerAddress = await this.gameContract.signer.getAddress();
        let player0Address = context.players[0];
        return Web3Utils.compareAddresses(signerAddress, player0Address);
    }
}
