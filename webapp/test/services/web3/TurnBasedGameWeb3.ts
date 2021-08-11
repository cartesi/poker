import { describe } from "mocha";
import { expect } from 'chai';
import { GameConstants } from "../../../src/GameConstants";
import { ServiceConfig } from "../../../src/services/ServiceConfig";
import { PokerToken__factory } from "../../../src/types";
import PokerToken from "../../../src/abis/PokerToken.json";
import TurnBasedGameLobby from "../../../src/abis/TurnBasedGameLobby.json";
import { LobbyWeb3 } from "../../../src/services/web3/LobbyWeb3";
import TurnBasedGame from "../../../src/abis/TurnBasedGame.json";
import { TurnBasedGameWeb3 } from "../../../src/services/web3/TurnBasedGameWeb3";
import { ethers } from "ethers";
import { Web3TestUtils } from "./Web3TestUtils";


describe('TurnBasedGameWeb3', function () {
    // creates a service config instance
    const serviceConfig: ServiceConfig = new ServiceConfig();

    let gameIndex: number;

    let turnBasedGameAlice: TurnBasedGameWeb3;
    let turnBasedGameBob: TurnBasedGameWeb3;

    let aliceAddress: string;
    const aliceAccountIndex: number = 0;

    let bobAddress: string;
    const bobAccountIndex: number = 1;

    let aliceFunds;
    let bobFunds;

    this.timeout(60000);

    beforeEach(async () => {
        ServiceConfig.currentInstance.setSigner(aliceAccountIndex);
        const aliceSigner = ServiceConfig.getSigner();
        aliceAddress = await aliceSigner.getAddress();

        ServiceConfig.currentInstance.setSigner(bobAccountIndex);
        const bobSigner = ServiceConfig.getSigner();
        bobAddress = await bobSigner.getAddress();

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

    it('should allow a player to submit a turn, claim for a result and confirm the result', async () => {
        const aliceInfo = { name: "Alice", avatar: 1 };
        const bobInfo = { name: "Bob", avatar: 2 };

        // Player 1 joins the game
        ServiceConfig.currentInstance.setSigner(aliceAccountIndex);
        let aliceGameReadyStatus: boolean = false;
        let aliceGameReadyCallback = function (index, context) {
            gameIndex = index;
            aliceGameReadyStatus = true;
            console.log("gameReadyCallbackPlayer1 was called with index=" + index);
        };
        await LobbyWeb3.joinGame(aliceInfo, aliceGameReadyCallback);

        // Player 2 joins the game
        ServiceConfig.currentInstance.setSigner(bobAccountIndex);

        let bobGameReadyStatus: boolean = false;
        let bobGameReadyCallback = function (index, context) {
            bobGameReadyStatus = true;
            console.log("gameReadyCallbackPlayer2 was called with index=" + index);
        };
        await LobbyWeb3.joinGame(bobInfo, bobGameReadyCallback);

        // Alice and Bob must receive the gameReady event
        // to be able to submit their turns
        await Web3TestUtils.waitUntil(5000);
        expect(aliceGameReadyStatus).to.be.true;
        expect(bobGameReadyStatus).to.be.true;

        // create turnbasedgame instance for Alice
        ServiceConfig.currentInstance.setSigner(aliceAccountIndex);
        turnBasedGameAlice = new TurnBasedGameWeb3(gameIndex);
        await turnBasedGameAlice.initWeb3();

        // data alice will submit
        let aliceData: Uint8Array = new Uint8Array([10,20]);

        // create turnbasedgame instance for Bob
        ServiceConfig.currentInstance.setSigner(bobAccountIndex);
        turnBasedGameBob = new TurnBasedGameWeb3(gameIndex);
        await turnBasedGameBob.initWeb3();

        // set up callback for Bob receive Alice's turn
        let turnOverPromise: Promise<any> = turnBasedGameBob.receiveTurnOver();

        // alice submit a turn
        ServiceConfig.currentInstance.setSigner(aliceAccountIndex);
        await turnBasedGameAlice.submitTurn(aliceData);

        await turnOverPromise.then((data) => {
            expect(data).to.be.eql(aliceData);
        })

        // set up callback for Bob receive Alice's claim for the result
        ServiceConfig.currentInstance.setSigner(bobAccountIndex);
        let claimResultPromise: Promise<any> = turnBasedGameBob.receiveResultClaimed();

        // set up callback for Alice receive game end event
        ServiceConfig.currentInstance.setSigner(aliceAccountIndex);
        let gameEndPromise: Promise<void> = turnBasedGameAlice.receiveGameOver();

        // alice claim result
        ServiceConfig.currentInstance.setSigner(aliceAccountIndex);
        let claimedResult: Array<number> = [10, 5];
        await turnBasedGameAlice.claimResult(claimedResult);

        // bob must receive the claim from alice
        await claimResultPromise.then((claimedResult) => {
            expect(claimedResult[0] == 10).to.be.true;
            expect(claimedResult[1] == 5).to.be.true;
        });

        // bob confirms the result
        ServiceConfig.currentInstance.setSigner(bobAccountIndex);
        await turnBasedGameBob.confirmResult();

        // alice must receive the game end event
        await gameEndPromise.then((confirmedResult) => {
            expect(confirmedResult[0] == 10).to.be.true;
            expect(confirmedResult[1] == 5).to.be.true;
        })
    });
});
