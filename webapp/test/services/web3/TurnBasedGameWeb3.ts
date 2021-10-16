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
import { ProviderType } from "../../../src/services/web3/provider/Provider";
import { VerificationState } from "../../../src/services/Game";

describe("TurnBasedGameWeb3", function () {
    // creates a service config instance
    const serviceConfig: ServiceConfig = new ServiceConfig(ProviderType.JsonRpc);

    let gameIndex: number;

    let turnBasedGameAlice: TurnBasedGameWeb3;
    let turnBasedGameBob: TurnBasedGameWeb3;

    const aliceAddress: string = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
    const bobAddress: string = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";

    const aliceInfo = { name: "Alice", avatar: 1 };
    const bobInfo = { name: "Bob", avatar: 2 };

    let aliceFunds;
    let bobFunds;

    this.timeout(600000);

    beforeEach(async () => {
        serviceConfig.setChain(ChainId.LOCALHOST_HARDHAT);

        ServiceConfig.currentInstance.setSigner(aliceAddress);
        const aliceSigner = ServiceConfig.getSigner();

        ServiceConfig.currentInstance.setSigner(bobAddress);
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
        ServiceConfig.currentInstance.setSigner(aliceAddress);
        let aliceGameReadyCallback = function (index, context) {
            gameIndex = index;
            gameReadyResolverPlayer1(true);
            console.log("gameReadyCallbackPlayer1 was called with index=" + index);
        };
        await LobbyWeb3.joinGame(aliceInfo, aliceGameReadyCallback);

        // Player 2 joins the game
        ServiceConfig.currentInstance.setSigner(bobAddress);
        let bobGameReadyCallback = function (index, context) {
            gameReadyResolverPlayer2(true);
            console.log("gameReadyCallbackPlayer2 was called with index=" + index);
        };
        await LobbyWeb3.joinGame(bobInfo, bobGameReadyCallback);

        // Alice and Bob must receive the gameReady event
        // to be able to submit their turns
        await promiseIsGameReadyPlayer1.then((isGameReady) => {
            expect(isGameReady).to.be.true;
        });
        await promiseIsGameReadyPlayer2.then((isGameReady) => {
            expect(isGameReady).to.be.true;
        });

        // create turnbasedgame instance for Alice
        ServiceConfig.currentInstance.setSigner(aliceAddress);
        turnBasedGameAlice = new TurnBasedGameWeb3(gameIndex);
        await turnBasedGameAlice.initWeb3();

        // data alice will submit
        let aliceData: Uint8Array = new Uint8Array([10, 20, 0, 0, 0, 0, 0, 0]);

        // create turnbasedgame instance for Bob
        ServiceConfig.currentInstance.setSigner(bobAddress);
        turnBasedGameBob = new TurnBasedGameWeb3(gameIndex);
        await turnBasedGameBob.initWeb3();

        // set up callback for Bob receive Alice's turn
        let turnOverPromise: Promise<any> = turnBasedGameBob.receiveTurnOver();

        // alice submit a turn
        ServiceConfig.currentInstance.setSigner(aliceAddress);
        await turnBasedGameAlice.submitTurn(aliceData);

        await turnOverPromise.then((data) => {
            expect(data).to.be.eql(aliceData);
        });

        // set up callback for Bob receive Alice's claim for the result
        ServiceConfig.currentInstance.setSigner(bobAddress);
        let claimResultPromise: Promise<any> = turnBasedGameBob.receiveResultClaimed();

        // set up callback for Alice receive game end event
        ServiceConfig.currentInstance.setSigner(aliceAddress);
        let gameEndPromise: Promise<void> = turnBasedGameAlice.receiveGameOver();

        // alice claim result
        ServiceConfig.currentInstance.setSigner(aliceAddress);
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

    // NOTE: this test requires the machine specified by GameConstants.GAME_TEMPLATE_HASH to be present in the local Descartes Environment
    it("should allow a player to challenge a game and apply verification result", async () => {
        // Players join the game
        let gameReadyPromiseResolver: (number) => void;
        const gameReadyPromise = new Promise<number>((resolve) => {
            gameReadyPromiseResolver = resolve;
        });
        ServiceConfig.currentInstance.setSigner(aliceAddress);
        LobbyWeb3.joinGame(aliceInfo, () => {});
        ServiceConfig.currentInstance.setSigner(bobAddress);
        LobbyWeb3.joinGame(bobInfo, (index, context) => {
            gameReadyPromiseResolver(index);
        });

        // retrieves gameIndex from GameReady event
        let gameIndex: number = await Promise.resolve(gameReadyPromise);

        // creates TurnBasedGame instance
        const turnBasedGame = new TurnBasedGameWeb3(gameIndex);

        // sets up callbacks to receive verification updates and game end
        let verificationUpdatePromise: Promise<[VerificationState, string]> = turnBasedGame.receiveVerificationUpdate();
        let gameOverPromise: Promise<any> = turnBasedGame.receiveGameOver();

        // bob challenges game (and will lose all funds)
        ServiceConfig.currentInstance.setSigner(bobAddress);
        turnBasedGame.challengeGame("Challenge Test");

        // check verification states
        let [state] = await Promise.resolve(verificationUpdatePromise);
        expect(state).eq(VerificationState.STARTED);

        verificationUpdatePromise = turnBasedGame.receiveVerificationUpdate();
        [state] = await Promise.resolve(verificationUpdatePromise);
        expect(state).eq(VerificationState.RESULT_SUBMITTED);

        verificationUpdatePromise = turnBasedGame.receiveVerificationUpdate();
        [state] = await Promise.resolve(verificationUpdatePromise);
        expect(state).eq(VerificationState.RESULT_CONFIRMED);

        verificationUpdatePromise = turnBasedGame.receiveVerificationUpdate();
        [state] = await Promise.resolve(verificationUpdatePromise);
        expect(state).eq(VerificationState.ENDED);

        // check game end: result should give all funds to alice
        const result = await Promise.resolve(gameOverPromise);
        expect(result.length).to.equal(2);
        console.log(`Result: [${result[0].toString()}, ${result[1].toString()}]`);
        expect(result[0]).to.eql(ethers.BigNumber.from(GameConstants.MIN_FUNDS.mul(2)));
        expect(result[1]).to.eql(ethers.BigNumber.from(0));

        // check if player balances reflect the result
        const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, ServiceConfig.getSigner());
        expect(await pokerTokenContract.balanceOf(aliceAddress)).to.eql(result[0]);
        expect(await pokerTokenContract.balanceOf(bobAddress)).to.eql(result[1]);

        // Remove listeners
        turnBasedGame.removeListeners();
    });
});
