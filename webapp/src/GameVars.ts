export class GameVars {

    public static gameData: GameData;
    public static appState: AppState;
    public static scaleY: number;
    public static isDesktop: boolean;
    public static aspectRatio: number;
    public static currentScene: Phaser.Scene;
  
    public static formatNumber(value: number): string {

        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    public static formatString(value: string): string {

        let newStr = value.replace(/_/g, " ");
        newStr = newStr.charAt(0).toUpperCase() + newStr.slice(1);

        return newStr;
    }
}
