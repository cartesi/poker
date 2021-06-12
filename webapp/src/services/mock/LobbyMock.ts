import { Lobby } from "../Lobby";

export class LobbyMock {
    /**
     * Joins a new Texas Holdem game using a mock implementation
     */
    public static async joinGame(playerInfo: object, gameReadyCallback) {
        var gameIndex = 0;
        var opponentAvatar = Math.ceil(Math.random() * 6);
        var context = {
            gameTemplateHash: Lobby.TEXAS_HODLEM_TEMPLATE_HASH,
            gameMetadata: Lobby.TEXAS_HODLEM_METADATA,
            players: Lobby.VALIDATORS_LOCALHOST,
            playerFunds: [100, 100],
            playerInfos: [playerInfo, { name: "Sam", avatar: opponentAvatar }],
            playerIndex: 0,
            opponentIndex: 1,
        };
        setTimeout(() => gameReadyCallback(gameIndex, context), 6000);
    }
}
