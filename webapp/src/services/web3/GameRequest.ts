import { GameData } from "../../../types/webapp";

/**
 * Class used for requests to the web3 layer.
 */
export class GameRequest {
    // Player information
    public gameData: GameData;
    // Player account index in the network been called
    public accountIndex: number;

    constructor(_gameData: GameData, _accountIndex: number) {
        this.gameData = _gameData;
        this.accountIndex = _accountIndex;
    }

    /**
     * @returns Player info to be hashed
     */
    public getPlayerInfo(): any {
        return {
            name: this.gameData.name,
            avatar: this.gameData.avatar
        };
    };
}