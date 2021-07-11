import { describe } from "mocha";
import { expect } from 'chai';
import { GameVars } from "../../../src/GameVars";
import { GameConstants } from "../../../src/GameConstants";
import { GameData } from "@cartesi/poker-webapp/types/webapp";
import { ServiceConfig } from "../../../src/services/ServiceConfig";
import { PokerToken__factory } from "../../../src/types";
import PokerToken from "../../../src/abis/PokerToken.json";
import TurnBasedGameLobby from "../../../src/abis/TurnBasedGameLobby.json";
import { LobbyWeb3 } from "../../../src/services/web3/LobbyWeb3";
import { GameRequest } from "../../../src/services/web3/GameRequest";

describe('LobbyWeb3', () => {
    // creates a service config instance
    const serviceConfig: ServiceConfig = new ServiceConfig();

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

    it('should notify game ready when the correct number of players have joined', async () => {
        const player1Info = { name: "Alice", avatar: 1 };
        const player2Info = { name: "Bob", avatar: 2 };

        // Player 1 joins the game
        ServiceConfig.currentInstance.setSigner(aliceAccountIndex);
        let gameReadyStatusPlayer1: boolean = false;
        let gameReadyCallbackPlayer1 = function (index, context) {
            console.log("gameReadyCallbackPlayer1 was called");
            gameReadyStatusPlayer1 = true;
        };
        await LobbyWeb3.joinGame(player1Info, gameReadyCallbackPlayer1);

        // Player 2 joins the game
        ServiceConfig.currentInstance.setSigner(bobAccountIndex);

        let gameReadyStatusPlayer2: boolean = false;
        let gameReadyCallbackPlayer2 = function (index, context) {
            console.log("gameReadyCallbackPlayer2 was called");
            gameReadyStatusPlayer2 = true;
        };
        await LobbyWeb3.joinGame(player2Info, gameReadyCallbackPlayer2);

        setTimeout(() => {
            // Alice and Bob must receive the gameReady event
            expect(gameReadyStatusPlayer1).to.be.true;
            expect(gameReadyStatusPlayer2).to.be.true;
        }, 5000);
    });
});