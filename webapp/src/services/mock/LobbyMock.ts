import { GameConstants } from "../../GameConstants";
import { ethers } from "ethers";

export class LobbyMock {
    public static PLAYER_FUNDS = ethers.BigNumber.from(100);

    /**
     * Joins a new Texas Holdem game using a mock implementation
     */
    public static async joinGame(playerInfo: object, gameReadyCallback) {
        var gameIndex = 0;
        var opponentAvatar = Math.ceil(Math.random() * 6);
        var context = {
            gameTemplateHash: GameConstants.GAME_TEMPLATE_HASH,
            gameMetadata: GameConstants.GAME_METADATA,
            players: ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"],
            playerFunds: [this.PLAYER_FUNDS, this.PLAYER_FUNDS],
            playerInfos: [playerInfo, { name: "Sam", avatar: opponentAvatar }],
            playerIndex: 0,
            opponentIndex: 1,
        };
        setTimeout(() => gameReadyCallback(gameIndex, context), 6000);
    }
}
