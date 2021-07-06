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
        const signer = provider.getSigner();
        const signerAddress = await signer.getAddress();

        const pokerTokenContract = PokerToken__factory.connect(PokerToken.address, signer);

        await pokerTokenContract.mint(signerAddress, GameConstants.MIN_FUNDS);
        let playerFunds = await pokerTokenContract.balanceOf(signerAddress);
        await pokerTokenContract.approve(TurnBasedGameLobby.address, playerFunds);
    });

    it('should allow a player to join a game', async () => {
        //const { name, avatar } = GameVars.gameData;
        const playerInfo = { name: "Name", avatar: 1 };

        let gameReadyStatus: boolean = false;
        let gameReadyCallback = function () {
            gameReadyStatus = true;
        };

        await LobbyWeb3.joinGame(playerInfo, gameReadyCallback);

        expect(gameReadyStatus).to.be.false;
    });
});