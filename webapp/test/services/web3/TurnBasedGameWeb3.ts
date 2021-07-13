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

describe('TurnBasedGameWeb3', () => {
    // creates a service config instance
    const serviceConfig: ServiceConfig = new ServiceConfig();

    let gameIndex: number;

    let gameContractAlice: TurnBasedGameWeb3;
    let gameContractBob: TurnBasedGameWeb3;

    const aliceAccountIndex: number = 0;
    const bobAccountIndex: number = 1;

    beforeEach(async () => {
        ServiceConfig.currentInstance.setSigner(aliceAccountIndex);
        const aliceSigner = ServiceConfig.getSigner();
        const aliceAddress = await aliceSigner.getAddress();

        ServiceConfig.currentInstance.setSigner(bobAccountIndex);
        const bobSigner = ServiceConfig.getSigner();
        const bobAddress = await bobSigner.getAddress();

        const pokerTokenContractAlice = PokerToken__factory.connect(PokerToken.address, aliceSigner);
        const pokerTokenContractBob = PokerToken__factory.connect(PokerToken.address, bobSigner);

        // Mint tokens (Alice has minter role) for players
        await pokerTokenContractAlice.mint(aliceAddress, GameConstants.MIN_FUNDS);
        await pokerTokenContractAlice.mint(bobAddress, GameConstants.MIN_FUNDS);

        // Setup for Alice
        let aliceFunds = await pokerTokenContractAlice.balanceOf(aliceAddress);
        await pokerTokenContractAlice.approve(TurnBasedGameLobby.address, aliceFunds);

        // Setup for Bob
        let bobFunds = await pokerTokenContractBob.balanceOf(bobAddress);
        await pokerTokenContractBob.approve(TurnBasedGameLobby.address, bobFunds);
    });

    it.skip('should notify game ready when the correct number of players have joined', async () => {
        const aliceInfo = { name: "Alice", avatar: 1 };
        const bobInfo = { name: "Bob", avatar: 2 };

        // Player 1 joins the game
        ServiceConfig.currentInstance.setSigner(aliceAccountIndex);
        let aliceGameReadyStatus: boolean = false;
        let aliceGameReadyCallback = function (index, context) {
            gameIndex = index;
            aliceGameReadyStatus = true;
            console.log("gameReadyCallbackPlayer1 was called");
        };
        await LobbyWeb3.joinGame(aliceInfo, aliceGameReadyCallback);

        // Player 2 joins the game
        ServiceConfig.currentInstance.setSigner(bobAccountIndex);

        let bobGameReadyStatus: boolean = false;
        let bobGameReadyCallback = function (index, context) {
            bobGameReadyStatus = true;
            console.log("gameReadyCallbackPlayer2 was called");
        };
        await LobbyWeb3.joinGame(bobInfo, bobGameReadyCallback);

        setTimeout(() => {
            // Alice and Bob must receive the gameReady event
            expect(aliceGameReadyStatus).to.be.true;
            expect(bobGameReadyStatus).to.be.true;
        }, 5000);


        ServiceConfig.currentInstance.setSigner(aliceAccountIndex);
        gameContractAlice = new TurnBasedGameWeb3(gameIndex);
        await gameContractAlice.initWeb3();

        ServiceConfig.currentInstance.setSigner(bobAccountIndex);
        gameContractBob = new TurnBasedGameWeb3(gameIndex);
        await gameContractBob.initWeb3();

        let gameData: string = "0x00000000000000010000000000000002";
        gameContractAlice.submitTurn(gameData);

        //Expects Bob receive turnOver event
    });
});