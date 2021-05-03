declare var Transport: any;
declare var Game: any;
declare var ALICE: number;
declare var BOB: number;

declare interface GameData {
    muted: boolean;
    name: string;
    avatar: number;
}

declare interface AppState {
    web3: any;
    account: string;
    ethBalance: string;
    zoom: any;
    user1: string;
    address1: string;
    user2: string;
    address2: string;
}