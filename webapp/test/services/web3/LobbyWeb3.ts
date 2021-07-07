import { describe } from "mocha";
import { expect } from 'chai';
import { GameVars } from "../../../src/GameVars";
import { GameConstants } from "../../../src/GameConstants";
import { ServiceConfig } from "../../../src/services/ServiceConfig";
import { PokerToken__factory } from "../../../src/types";
import PokerToken from "../../../src/abis/PokerToken.json";
import TurnBasedGameLobby from "../../../src/abis/TurnBasedGameLobby.json";
import { LobbyWeb3 } from "../../../src/services/web3/LobbyWeb3";

describe('LobbyWeb3', () => {

    beforeEach(async () => {
        const { provider } = ServiceConfig.getProviderConfiguration();

        const aliceSigner = provider.getSigner(0);
        const aliceAddress = await aliceSigner.getAddress();

        const bobSigner = provider.getSigner(1);
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

    it.skip('should allow a player to join a game', async () => {
        const playerInfo = { name: "Alice", avatar: 1 };

        let gameReadyStatus: boolean = false;
        let gameReadyCallback = function () {
            gameReadyStatus = true;
        };

        await LobbyWeb3.joinGame(playerInfo, gameReadyCallback);

        expect(gameReadyStatus).to.be.false;
    });

    it('should notify game ready when the correct number of players have joined', async () => {
        const player1Info = { name: "Alice", avatar: 1 };
        const player2Info = { name: "Bob", avatar: 2 };

        // Player 1 joins the game
        let gameReadyStatusPlayer1: boolean = false;
        let gameReadyCallbackPlayer1 = function () {
            gameReadyStatusPlayer1 = true;
        };
        await LobbyWeb3.joinGame(player1Info, gameReadyCallbackPlayer1);
        expect(gameReadyStatusPlayer1).to.be.false;

        // Player 2 joing the game
        let gameReadyStatusPlayer2: boolean = false;
        let gameReadyCallbackPlayer2 = function () {
            gameReadyStatusPlayer2 = true;
        };
        await LobbyWeb3.joinGame(player2Info, gameReadyCallbackPlayer2);
        expect(gameReadyStatusPlayer2).to.be.true;
    });
});