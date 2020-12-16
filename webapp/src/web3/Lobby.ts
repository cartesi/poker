export class Lobby {

    private static readonly TEXAS_HOLDEM_TEMPLATE_HASH = "0x88040f919276854d14efb58967e5c0cb2fa637ae58539a1c71c7b98b4f959baa";
    private static readonly TEXAS_HOLDEM_METADATA = "0x0";
    private static readonly MIN_FUNDS = 10;

    /**
     * Joins a new Texas Holdem game
     * 
     * @param name name of the player joining
     * @param funds funds being brought to the game
     * @param gameReadyCallback callback to be called once game is ready to start, receiving two arguments: the new game's index and its full context (players involved, etc)
     */
    public static joinGame(name: string, funds: number, gameReadyCallback) {

        // FIXME: this is a mock implementation
        // - the real impl should call TurnBasedGameLobby.joinGame() and wait for TurnBasedGame.GameReady event

        if (funds < this.MIN_FUNDS) {
            throw `Player's staked funds (${funds}) is insufficient to join the game (minimum is ${this.MIN_FUNDS}).`
        }

        var index = 0;
        var context = {
            gameTemplateHash: this.TEXAS_HOLDEM_TEMPLATE_HASH,
            gameMetadata: this.TEXAS_HOLDEM_METADATA,
            players: ['0xe9bE0C14D35c5fA61B8c0B34f4c4e2891eC12e7E','0x91472CCE70B1080FdD969D41151F2763a4A22717'],
            playerFunds: [funds, 100],
            playerInfos: [name, "Bob"]
        };
        setTimeout(() => gameReadyCallback(index, context), 3000);
    }

}