export class GameConstants {

    public static readonly VERSION = "0.0";
    public static readonly DEVELOPMENT = true;
    public static readonly VERBOSE = false;
    public static readonly GAME_WIDTH = 1280;
    public static readonly GAME_HEIGHT = 853;

    public static readonly STATES = ["START", "PREFLOP", "FLOP", "TURN", "RIVER", "SHOWDOWN", "END"];
    
    public static readonly ACTION_CALL = "CALL";
    public static readonly ACTION_CHECK = "CHECK";
    public static readonly ACTION_RAISE = "RAISE";
    public static readonly ACTION_FOLD = "FOLD";

    public static readonly SAVED_GAME_DATA_KEY = "poker-data";
}
