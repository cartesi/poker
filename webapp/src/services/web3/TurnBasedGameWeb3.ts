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

    turnInfoQueue: Array<any>;
    onTurnOverReceivedResolvers: Array<(any) => any>;

    claimedResult: any;
    onResultClaimReceived: (claimedResult: any) => any;
    onGameOverReceived: (confirmedResult: any) => any;

    descartesListeners: object = {};
    onGameChallengeReceived: (msg: string) => any;
    onVerificationUpdate: (update: [VerificationState, string]) => any;

    constructor(private gameIndex: number) {
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
        if (this.descartesContract) {
            this.descartesContract.removeAllListeners();
        }
        if (this.gameContextContract) {
            this.gameContextContract.removeAllListeners();
        }
    }

    /**
     * Returns application player's address, which may be compared with contract information
     * @returns a 20-byte hex string representing the player's address
     */
    async getPlayerAddress(): Promise<string> {
        return await this.gameContract.signer.getAddress();
    }

    // TURN SUBMISSION
    async submitTurn(info: TurnInfo): Promise<TurnInfo> {
        await this.initWeb3();

        await ErrorHandler.execute("submitTurn", async () => {
            const context = await this.gameContract.getContext(this.gameIndex);
            const turnIndex = context.turns.length;
            const nextPlayerAddress = context.players[info.nextPlayer];
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

        // stores turn info in queue and checks for listeners
        const turnInfo = { data, nextPlayer: turn.nextPlayer, playerStake: turn.playerStake };
        this.turnInfoQueue.push(turnInfo);
        this.dispatchTurn();
    }
    async receiveTurnOver() {
        return new Promise<TurnInfo>(async (resolve) => {
            await this.initWeb3();
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
        // TODO: before submitting the timeout claim (and spending tx fees), we could check the game context to ensure there is indeed a timeout
        await ErrorHandler.execute("claimTimeout", async () => {
            const tx = await this.gameContract.claimTimeout(this.gameIndex);
            console.log(
                `Claimed opponent timeout for game '${this.gameIndex}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})`
            );
        });
    }
    async challengeGame(msg: string): Promise<void> {
        await this.initWeb3();
        await ErrorHandler.execute("challengeGame", async () => {
            const tx = await this.gameContract.challengeGame(this.gameIndex);
            console.log(`Challenged game '${this.gameIndex}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})`);
        });
    }
    onGameChallenged(gameIndex, descartesIndex, author, message) {
        if (this.onGameChallengeReceived) {
            this.onGameChallengeReceived(gameIndex);
        }

        // turns off previous listeners for Descartes events, if there were any
        for (let eventName in this.descartesListeners) {
            this.descartesContract.off(eventName, this.descartesListeners[eventName]);
        }

        // builds listeners for Descartes events targeting this specific challenge
        this.descartesListeners = this.buildDescartesListeners(descartesIndex, author, message);

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
    async applyVerificationResult(): Promise<any> {
        await this.initWeb3();
        await ErrorHandler.execute("applyVerificationResult", async () => {
            const tx = await this.gameContract.applyVerificationResult(this.gameIndex);
            console.log(
                `Applying verification result for game '${this.gameIndex}' (tx: ${tx.hash} ; blocknumber: ${tx.blockNumber})`
            );
        });
    }

    buildDescartesListeners(descartesIndex: BigNumber, author: string, message: string): object {
        const self = this;
        const listeners = {};

        listeners["DescartesCreated"] = function (descartesIndexEvent: BigNumber) {
            if (descartesIndexEvent.eq(descartesIndex)) {
                console.log(`Received 'DescartesCreated' event for Descartes computation ${descartesIndex}`);
                self.onVerificationUpdate([VerificationState.STARTED, message]);
            }
        };

        listeners["ClaimSubmitted"] = function (descartesIndexEvent: BigNumber) {
            if (descartesIndexEvent.eq(descartesIndex)) {
                console.log(`Received 'ClaimSubmitted' event for Descartes computation ${descartesIndex}`);
                self.onVerificationUpdate([VerificationState.RESULT_SUBMITTED, message]);
            }
        };

        listeners["Confirmed"] = function (descartesIndexEvent: BigNumber) {
            if (descartesIndexEvent.eq(descartesIndex)) {
                console.log(`Received 'Confirmed' event for Descartes computation ${descartesIndex}`);
                self.onVerificationUpdate([VerificationState.RESULT_CONFIRMED, message]);
            }
        };

        listeners["ChallengeStarted"] = function (descartesIndexEvent: BigNumber) {
            if (descartesIndexEvent.eq(descartesIndex)) {
                console.log(`Received 'ChallengeStarted' event for Descartes computation ${descartesIndex}`);
                self.onVerificationUpdate([VerificationState.RESULT_CHALLENGED, message]);
            }
        };

        listeners["DescartesFinished"] = async function (descartesIndexEvent: BigNumber, state: string) {
            if (descartesIndexEvent.eq(descartesIndex)) {
                console.log(`Received 'DescartesFinished' event for Descartes computation ${descartesIndex}`);
                const stateStr = ethers.utils.toUtf8String(state);
                let verificationState: VerificationState;
                if (
                    stateStr.startsWith("ConsensusResult") ||
                    stateStr.startsWith("ClaimerWon") ||
                    stateStr.startsWith("ChallengerWon")
                ) {
                    // result successfully computed: apply it if this user has the most funds at stake (i.e., if this is the party most interested in applying the result)
                    verificationState = VerificationState.ENDED;
                    let shouldApplyResult = true;
                    try {
                        const result = await self.descartesContract.getResult(descartesIndex);
                        const fundsShare = ethers.utils.arrayify(result[3]);
                        const fundsPlayer0 = BigNumber.from(fundsShare.slice(0, 32));
                        const fundsPlayer1 = BigNumber.from(fundsShare.slice(32, 64));
                        console.log(
                            `Retrieved result from Descartes computation '${descartesIndex}': fundsShare = [${fundsPlayer0.toString()}, ${fundsPlayer1.toString()}]`
                        );
                        const playerIndex = await self.getPlayerIndex();
                        const isLowerStake =
                            (playerIndex === 0 && fundsPlayer0 < fundsPlayer1) ||
                            (playerIndex === 1 && fundsPlayer1 < fundsPlayer0);
                        const isEqualStakeAndNotAuthor =
                            fundsPlayer0.eq(fundsPlayer1) && ServiceConfig.currentInstance.signerAddress !== author;
                        if (isLowerStake || isEqualStakeAndNotAuthor) {
                            // let the opponent apply the result
                            // - either this player has a lower stake locked in the game result, or stakes are equal and player is not the challenge author
                            console.log(
                                `Will NOT apply verification result: isLowerStake=${isLowerStake}, isEqualStakeAndNotAuthor=${isEqualStakeAndNotAuthor}`
                            );
                            shouldApplyResult = false;
                        } else {
                            console.log(
                                `Will apply verification result: isLowerStake=${isLowerStake}, isEqualStakeAndNotAuthor=${isEqualStakeAndNotAuthor}`
                            );
                        }
                    } catch (error) {
                        console.error(
                            `Error retrieving verification result from Descartes: will attempt to apply result anyway - ${error}`
                        );
                    }
                    if (shouldApplyResult) {
                        self.applyVerificationResult();
                    }
                } else {
                    // error computing result: try again if this is the author
                    verificationState = VerificationState.ERROR;
                    if (ServiceConfig.currentInstance.signerAddress == author) {
                        self.challengeGame(`Verification failed with state ${stateStr}`);
                    }
                }
                if (self.onVerificationUpdate) {
                    self.onVerificationUpdate([verificationState, message]);
                }
            }
        };

        return listeners;
    }

    async getPlayerIndex(): Promise<number> {
        await this.initWeb3();
        const context = await this.gameContract.getContext(this.gameIndex);
        // obs: uses hexlify to avoid issues with uppercase vs lowercase hex representations
        const signerAddress = ethers.utils.hexlify(ServiceConfig.currentInstance.signerAddress);
        const playerAddress0 = ethers.utils.hexlify(context.players[0]);
        return signerAddress == playerAddress0 ? 0 : 1;
    }
}
