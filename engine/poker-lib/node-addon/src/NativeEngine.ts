import { BigNumber } from "ethers";
import { Engine, EngineBetType, EngineResult, EngineState, StatusCode } from "./Engine";

export class NativeEngine implements Engine {
    private player: any;
    private lib: any;

    constructor(private player_id: number, lib_path: string = null) {
        if (lib_path == null) lib_path = "../../assets/native/pokerlib";
        this.lib = require(lib_path);
    }

    init(
        alice_funds: BigNumber,
        bob_funds: BigNumber,
        big_blind: BigNumber,
        encryption: boolean
    ): Promise<EngineResult> {
        return new Promise((resolve, reject) => {
            try {
                this.lib.init(encryption, false);
                this.player = this.lib.newPlayer(this.player_id);
                this.lib.initPlayer(this.player, alice_funds.toString(), bob_funds.toString(), big_blind.toString());
                resolve({ status: StatusCode.SUCCESS });
            } catch (error) {
                reject(error);
            }
        });
    }

    create_handshake(): Promise<EngineResult> {
        return new Promise((resolve, reject) => {
            try {
                const msg = this.lib.createHandshake(this.player);
                resolve({
                    status: StatusCode.CONTINUED,
                    message_out: msg,
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    process_handshake(message_in: Uint8Array): Promise<EngineResult> {
        return new Promise((resolve, reject) => {
            try {
                const result = this.lib.processHandshake(this.player, message_in);
                resolve({
                    status: result.continued ? StatusCode.CONTINUED : StatusCode.SUCCESS,
                    message_out: result.response,
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    create_bet(type: EngineBetType, amount: BigNumber): Promise<EngineResult> {
        return new Promise((resolve, reject) => {
            try {
                const result = this.lib.createBet(this.player, type, amount.toString());
                resolve({
                    status: result.continued ? StatusCode.CONTINUED : StatusCode.SUCCESS,
                    message_out: result.response,
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    process_bet(message_in: Uint8Array): Promise<EngineResult> {
        return new Promise((resolve, reject) => {
            try {
                const result = this.lib.processBet(this.player, message_in);
                resolve({
                    status: result.continued ? StatusCode.CONTINUED : StatusCode.SUCCESS,
                    message_out: result.response,
                    betType: result.betType,
                    amount: result.amount,
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    game_state(): Promise<EngineState> {
        return new Promise((resolve, reject) => {
            try {
                const stateString = this.lib.getGameState(this.player);
                const state = JSON.parse(stateString, (key, value) => {
                    switch (key) {
                        case "total_funds":
                        case "bets":
                            return BigNumber.from(value);
                        case "funds_share":
                            const fundsShare = Array(2);
                            fundsShare[0] = BigNumber.from(value[0]);
                            fundsShare[1] = BigNumber.from(value[1]);
                            return fundsShare;
                        default:
                            return value;
                    }
                });
                resolve(state);
            } catch (error) {
                reject(error);
            }
        });
    }
}
