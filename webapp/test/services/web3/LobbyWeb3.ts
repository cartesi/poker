import { describe } from "mocha";
import { expect } from 'chai';
import { GameVars } from "../../../src/GameVars";
import { LobbyWeb3 } from "../../../src/services/web3/LobbyWeb3";

describe('LobbyWeb3', () => {

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