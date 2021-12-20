import { describe } from "mocha";
import { expect } from "chai";
import { GameConstants, ChainId } from "../../../src/GameConstants";
import { ServiceConfig } from "../../../src/services/ServiceConfig";
import { PokerToken__factory } from "../../../src/types";
import PokerToken from "../../../src/abis/PokerToken.json";
import TurnBasedGameLobby from "../../../src/abis/TurnBasedGameLobby.json";
import { LobbyWeb3 } from "../../../src/services/web3/LobbyWeb3";
import { TurnBasedGameWeb3 } from "../../../src/services/web3/TurnBasedGameWeb3";
import { ethers } from "ethers";
import { VerificationState } from "../../../src/services/Game";
import { TurnInfo } from "../../../src/services/TurnBasedGame";
import { TestWeb3Utils } from "./TestWeb3Utils";

describe("TurnBasedGameWeb3", function () {
    let gameIndex: ethers.BigNumber;

    let turnBasedGameAlice: TurnBasedGameWeb3;
    let turnBasedGameBob: TurnBasedGameWeb3;

    let lobbyWeb3Alice: LobbyWeb3;
    let lobbyWeb3Bob: LobbyWeb3;

    const aliceAddress: string = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
    const bobAddress: string = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";

    const aliceInfo = { name: "Alice", avatar: 1 };
    const bobInfo = { name: "Bob", avatar: 2 };

    let aliceFunds;
    let bobFunds;

    this.timeout(600000);

    beforeEach(async () => {
        ServiceConfig.setChainId(ChainId.LOCALHOST_HARDHAT);

        TestWeb3Utils.setSigner(aliceAddress);
        const aliceSigner = ServiceConfig.getSigner();

        TestWeb3Utils.setSigner(bobAddress);
        const bobSigner = ServiceConfig.getSigner();

        const pokerTokenContractAlice = PokerToken__factory.connect(PokerToken.address, aliceSigner);
        const pokerTokenContractBob = PokerToken__factory.connect(PokerToken.address, bobSigner);

        // Mint tokens (Alice has minter role) for players
        await pokerTokenContractAlice.mint(aliceAddress, GameConstants.MIN_FUNDS);
        await pokerTokenContractAlice.mint(bobAddress, GameConstants.MIN_FUNDS);

        // Setup for Alice
        aliceFunds = await pokerTokenContractAlice.balanceOf(aliceAddress);
        await pokerTokenContractAlice.approve(TurnBasedGameLobby.address, aliceFunds);

        // Setup for Bob
        bobFunds = await pokerTokenContractBob.balanceOf(bobAddress);
        await pokerTokenContractBob.approve(TurnBasedGameLobby.address, bobFunds);

        lobbyWeb3Alice = new LobbyWeb3();
        lobbyWeb3Bob = new LobbyWeb3();
    });

    it("should retrieve correct player and opponent indices", async () => {
        // Players join the game
        let gameReadyPromiseResolver: (number) => void;
        const gameReadyPromise = new Promise<ethers.BigNumber>((resolve) => {
            gameReadyPromiseResolver = resolve;
        });
        TestWeb3Utils.setSigner(aliceAddress);
        await lobbyWeb3Alice.joinGame(aliceInfo, () => {});
        TestWeb3Utils.setSigner(bobAddress);
        await lobbyWeb3Bob.joinGame(bobInfo, (index, context) => {
            gameReadyPromiseResolver(index);
        });

        // retrieves gameIndex from GameReady event
        let gameIndex: ethers.BigNumber = await Promise.resolve(gameReadyPromise);

        // creates turnbasedgame instance for Alice
        TestWeb3Utils.setSigner(aliceAddress);
        turnBasedGameAlice = new TurnBasedGameWeb3(gameIndex);
        await turnBasedGameAlice.initWeb3();

        // creates turnbasedgame instance for Bob
        TestWeb3Utils.setSigner(bobAddress);
        turnBasedGameBob = new TurnBasedGameWeb3(gameIndex);
        await turnBasedGameBob.initWeb3();

        // tests getPlayerIndex
        expect(await turnBasedGameAlice.getPlayerIndex(await turnBasedGameAlice.getGameContext())).to.equal(0);
        expect(await turnBasedGameBob.getPlayerIndex(await turnBasedGameBob.getGameContext())).to.equal(1);

        // tests getOpponentIndex
        expect(await turnBasedGameAlice.getOpponentIndex(await turnBasedGameAlice.getGameContext())).to.equal(1);
        expect(await turnBasedGameBob.getOpponentIndex(await turnBasedGameBob.getGameContext())).to.equal(0);

        turnBasedGameAlice.removeListeners();
        turnBasedGameBob.removeListeners();
    });

    it("should allow a player to submit a turn, claim for a result and confirm the result", async () => {
        // Creates a promise that will only be resolved when gameReady callback for player 1 is called
        let gameReadyResolverPlayer1: (boolean) => void;
        const promiseIsGameReadyPlayer1: Promise<boolean> = new Promise<boolean>((resolve: (boolean) => void) => {
            gameReadyResolverPlayer1 = resolve;
        });

        // Creates a promise that will only be resolved when gameReady callback for player 2 is called
        let gameReadyResolverPlayer2: (boolean) => void;
        const promiseIsGameReadyPlayer2: Promise<boolean> = new Promise<boolean>((resolve: (boolean) => void) => {
            gameReadyResolverPlayer2 = resolve;
        });

        // Player 1 joins the game
        TestWeb3Utils.setSigner(aliceAddress);
        let aliceGameReadyCallback = function (index, context) {
            gameIndex = index;
            gameReadyResolverPlayer1(true);
            console.log("gameReadyCallbackPlayer1 was called with index=" + index);
        };
        await lobbyWeb3Alice.joinGame(aliceInfo, aliceGameReadyCallback);

        // Player 2 joins the game
        TestWeb3Utils.setSigner(bobAddress);
        let bobGameReadyCallback = function (index, context) {
            gameReadyResolverPlayer2(true);
            console.log("gameReadyCallbackPlayer2 was called with index=" + index);
        };
        await lobbyWeb3Bob.joinGame(bobInfo, bobGameReadyCallback);

        // Alice and Bob must receive the gameReady event
        // to be able to submit their turns
        await promiseIsGameReadyPlayer1.then((isGameReady) => {
            expect(isGameReady).to.be.true;
        });
        await promiseIsGameReadyPlayer2.then((isGameReady) => {
            expect(isGameReady).to.be.true;
        });

        // create turnbasedgame instance for Alice (listeners turned off)
        TestWeb3Utils.setSigner(aliceAddress);
        turnBasedGameAlice = new TurnBasedGameWeb3(gameIndex);
        await turnBasedGameAlice.initWeb3();
        turnBasedGameAlice.removeListeners();

        // create turnbasedgame instance for Bob
        TestWeb3Utils.setSigner(bobAddress);
        turnBasedGameBob = new TurnBasedGameWeb3(gameIndex);
        await turnBasedGameBob.initWeb3();

        // set up callback for Bob receive Alice's turn
        let turnOverPromise: Promise<any> = turnBasedGameBob.receiveTurnOver();

        // data that alice will submit
        let aliceData: Uint8Array = new Uint8Array([10, 20, 0, 0, 0, 0, 0, 0]);
        let aliceTurnInfo: TurnInfo = { data: aliceData, nextPlayer: 1, playerStake: ethers.BigNumber.from(10) };

        // alice submit a turn
        await turnBasedGameAlice.submitTurn(aliceTurnInfo);
        await turnOverPromise.then((turnInfo) => {
            expect(turnInfo).to.be.eql(aliceTurnInfo);
        });

        // set up callback for Bob receive Alice's claim for the result
        TestWeb3Utils.setSigner(bobAddress);
        let claimResultPromise: Promise<any> = turnBasedGameBob.receiveResultClaimed();

        // set up callback for Alice receive game end event
        TestWeb3Utils.setSigner(aliceAddress);
        let gameEndPromise: Promise<void> = turnBasedGameAlice.receiveGameOver();

        // alice claim result
        let claimedResult: Array<number> = [10, 5];
        await turnBasedGameAlice.claimResult(claimedResult);

        // bob must receive the claim from alice
        await claimResultPromise.then((claimedResult) => {
            expect(claimedResult[0].eq(ethers.BigNumber.from(10)));
            expect(claimedResult[1].eq(ethers.BigNumber.from(5)));
        });

        // Remove listeners
        turnBasedGameAlice.removeListeners();
        turnBasedGameBob.removeListeners();
    });

    it("should allow a player to submit a turn, claim for a result and confirm the result: turn with no specified nextPlayer", async () => {
        // Players join the game
        let gameReadyPromiseResolver: (number) => void;
        const gameReadyPromise = new Promise<ethers.BigNumber>((resolve) => {
            gameReadyPromiseResolver = resolve;
        });
        TestWeb3Utils.setSigner(aliceAddress);
        await lobbyWeb3Alice.joinGame(aliceInfo, () => {});
        TestWeb3Utils.setSigner(bobAddress);
        await lobbyWeb3Bob.joinGame(bobInfo, (index, context) => {
            gameReadyPromiseResolver(index);
        });

        // retrieves gameIndex from GameReady event
        let gameIndex: ethers.BigNumber = await Promise.resolve(gameReadyPromise);

        // creates TurnBasedGame instance for Alice (listeners turned off)
        TestWeb3Utils.setSigner(aliceAddress);
        turnBasedGameAlice = new TurnBasedGameWeb3(gameIndex);
        await turnBasedGameAlice.initWeb3();
        turnBasedGameAlice.removeListeners();

        // create turnbasedgame instance for Bob
        TestWeb3Utils.setSigner(bobAddress);
        turnBasedGameBob = new TurnBasedGameWeb3(gameIndex);
        await turnBasedGameBob.initWeb3();

        // set up callback for Bob receive Alice's turn
        let turnOverPromise: Promise<any> = turnBasedGameBob.receiveTurnOver();

        // data that alice will submit
        let aliceData: Uint8Array = new Uint8Array([10, 20, 0, 0, 0, 0, 0, 0]);
        let aliceTurnInfo: TurnInfo = { data: aliceData, nextPlayer: -1, playerStake: ethers.BigNumber.from(10) };

        // alice submit a turn
        await turnBasedGameAlice.submitTurn(aliceTurnInfo);
        await turnOverPromise.then((turnInfo) => {
            expect(turnInfo).to.be.eql(aliceTurnInfo);
        });

        // set up callback for Bob receive Alice's claim for the result
        TestWeb3Utils.setSigner(bobAddress);
        let claimResultPromise: Promise<any> = turnBasedGameBob.receiveResultClaimed();

        // set up callback for Alice receive game end event
        TestWeb3Utils.setSigner(aliceAddress);
        let gameEndPromise: Promise<void> = turnBasedGameAlice.receiveGameOver();

        // alice claim result
        let claimedResult: Array<number> = [10, 5];
        await turnBasedGameAlice.claimResult(claimedResult);

        // bob must receive the claim from alice
        await claimResultPromise.then((claimedResult) => {
            expect(claimedResult[0].eq(ethers.BigNumber.from(10)));
            expect(claimedResult[1].eq(ethers.BigNumber.from(5)));
        });

        // Remove listeners
        turnBasedGameAlice.removeListeners();
        turnBasedGameBob.removeListeners();
    });

    it("should allow a player to claim timeout and end game when enough time has elapsed", async () => {
        // collects alice and bob balances in POKER tokens
        const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, ServiceConfig.getSigner());
        const aliceBalance = await pokerTokenContract.balanceOf(aliceAddress);
        const bobBalance = await pokerTokenContract.balanceOf(bobAddress);

        // Players join the game
        let gameReadyPromiseResolver: (number) => void;
        const gameReadyPromise = new Promise<ethers.BigNumber>((resolve) => {
            gameReadyPromiseResolver = resolve;
        });
        TestWeb3Utils.setSigner(aliceAddress);
        await lobbyWeb3Alice.joinGame(aliceInfo, () => {});
        TestWeb3Utils.setSigner(bobAddress);
        await lobbyWeb3Bob.joinGame(bobInfo, (index, context) => {
            gameReadyPromiseResolver(index);
        });

        // retrieves gameIndex from GameReady event
        let gameIndex: ethers.BigNumber = await Promise.resolve(gameReadyPromise);

        // creates TurnBasedGame instance for Alice (listeners turned off)
        TestWeb3Utils.setSigner(aliceAddress);
        turnBasedGameAlice = new TurnBasedGameWeb3(gameIndex);
        await turnBasedGameAlice.initWeb3();
        turnBasedGameAlice.removeListeners();

        // create turnbasedgame instance for Bob
        TestWeb3Utils.setSigner(bobAddress);
        turnBasedGameBob = new TurnBasedGameWeb3(gameIndex);
        await turnBasedGameBob.initWeb3();

        // sets up game end callback
        let gameOverPromise: Promise<any> = turnBasedGameBob.receiveGameOver();

        // alice submits a turn
        let aliceData = new Uint8Array([10, 20, 0, 0, 0, 0, 0, 0]);
        let alicePlayerStake = ethers.BigNumber.from(1);
        let aliceTurnInfo = { data: aliceData, nextPlayer: 1, playerStake: alicePlayerStake };
        await turnBasedGameAlice.submitTurn(aliceTurnInfo);

        // bob submits a turn
        let bobData = new Uint8Array([10, 20, 30, 0, 0, 0, 0, 0]);
        let bobPlayerStake = ethers.BigNumber.from(2);
        let bobTurnInfo = { data: bobData, nextPlayer: 0, playerStake: bobPlayerStake };
        await turnBasedGameBob.submitTurn(bobTurnInfo);

        // fast-forwards network time so that a timeout can be claimed (alice's fault)
        await TestWeb3Utils.increaseTime(GameConstants.TIMEOUT_SECONDS + 10);

        // bob claims timeout
        await turnBasedGameBob.claimTimeout();

        // check game end: result should give alice's staked funds to bob
        const result = await Promise.resolve(gameOverPromise);
        expect(result.length).to.equal(2);
        console.log(`Result: [${result[0].toString()}, ${result[1].toString()}]`);
        expect(result[0]).to.eql(aliceBalance.sub(alicePlayerStake));
        expect(result[1]).to.eql(bobBalance.add(alicePlayerStake));

        // check if player balances reflect the result
        expect(await pokerTokenContract.balanceOf(aliceAddress)).to.eql(result[0]);
        expect(await pokerTokenContract.balanceOf(bobAddress)).to.eql(result[1]);

        // Remove listeners
        turnBasedGameAlice.removeListeners();
        turnBasedGameBob.removeListeners();
    });

    // NOTE: this test requires the machine specified by GameConstants.GAME_TEMPLATE_HASH to be present in the local Descartes Environment
    it("should allow a player to challenge a game and apply verification result", async () => {
        // collects alice and bob balances in POKER tokens
        const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, ServiceConfig.getSigner());
        const aliceBalance = await pokerTokenContract.balanceOf(aliceAddress);
        const bobBalance = await pokerTokenContract.balanceOf(bobAddress);

        // Players join the game
        let gameReadyPromiseResolver: (number) => void;
        const gameReadyPromise = new Promise<ethers.BigNumber>((resolve) => {
            gameReadyPromiseResolver = resolve;
        });
        TestWeb3Utils.setSigner(aliceAddress);
        await lobbyWeb3Alice.joinGame(aliceInfo, () => {});
        TestWeb3Utils.setSigner(bobAddress);
        await lobbyWeb3Bob.joinGame(bobInfo, (index, context) => {
            gameReadyPromiseResolver(index);
        });

        // retrieves gameIndex from GameReady event
        let gameIndex: ethers.BigNumber = await Promise.resolve(gameReadyPromise);

        // creates TurnBasedGame instance for Alice
        TestWeb3Utils.setSigner(aliceAddress);
        turnBasedGameAlice = new TurnBasedGameWeb3(gameIndex);
        await turnBasedGameAlice.initWeb3();

        // create turnbasedgame instance for Bob (listeners turned off)
        TestWeb3Utils.setSigner(bobAddress);
        turnBasedGameBob = new TurnBasedGameWeb3(gameIndex);
        await turnBasedGameBob.initWeb3();
        turnBasedGameBob.removeListeners();

        // sets up callbacks to receive verification updates and game end
        let verificationUpdatePromise: Promise<[VerificationState, string]> =
            turnBasedGameAlice.receiveVerificationUpdate();
        let gameOverPromise: Promise<any> = turnBasedGameAlice.receiveGameOver();

        // bob challenges game (and will lose all funds)
        turnBasedGameBob.challengeGame("Challenge Test");

        // check verification states
        let [state] = await Promise.resolve(verificationUpdatePromise);
        expect(state).eq(VerificationState.STARTED);

        verificationUpdatePromise = turnBasedGameAlice.receiveVerificationUpdate();
        [state] = await Promise.resolve(verificationUpdatePromise);
        expect(state).eq(VerificationState.RESULT_SUBMITTED);

        verificationUpdatePromise = turnBasedGameAlice.receiveVerificationUpdate();
        [state] = await Promise.resolve(verificationUpdatePromise);
        expect(state).eq(VerificationState.RESULT_CONFIRMED);

        verificationUpdatePromise = turnBasedGameAlice.receiveVerificationUpdate();
        [state] = await Promise.resolve(verificationUpdatePromise);
        expect(state).eq(VerificationState.ENDED);

        // check game end: result should give all of bob's funds to alice
        // obs: alice's TurnBasedGameWeb3 instance will only submits a tx to apply the result if alice is the interested party (has the most funds in the result)
        const result = await Promise.resolve(gameOverPromise);
        expect(result.length).to.equal(2);
        console.log(`Result: [${result[0].toString()}, ${result[1].toString()}]`);
        expect(result[0]).to.eql(aliceBalance.add(bobBalance));
        expect(result[1]).to.eql(ethers.BigNumber.from(0));

        // check if player balances reflect the result
        expect(await pokerTokenContract.balanceOf(aliceAddress)).to.eql(result[0]);
        expect(await pokerTokenContract.balanceOf(bobAddress)).to.eql(result[1]);

        // Remove listeners
        turnBasedGameAlice.removeListeners();
        turnBasedGameBob.removeListeners();
    });
});
