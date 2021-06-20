import { ServiceConfig, ServiceType, ServiceImpl } from "./ServiceConfig";
import { TurnBasedGameMock } from "./mock/TurnBasedGameMock";
// import { TurnBasedGameWeb3 } from "./web3/TurnBasedGameWeb3";

export interface TurnBasedGame {
    connect(other: TurnBasedGame);
    send(data: any, callback?: (any) => any);
    receive(callback: (any) => any);
}

export class TurnBasedGameFactory {
    /**
     * Creates a new Transport instance based on service configuration
     *
     * @returns the Transport instance
     */
    public static create(): TurnBasedGame {
        const impl = ServiceConfig.get(ServiceType.Transport);
        if (impl === ServiceImpl.Mock) {
            // mock TurnBasedGame
            return new TurnBasedGameMock();
        } else if (impl == ServiceImpl.Web3) {
            // web3 TurnBasedGame
            // TODO: Web3 Transport not supported yet!
            return new TurnBasedGameMock();
            // return new TransportWeb3();
        } else {
            // unknown implementation configured
            throw `Unknown transport configuration '${impl}'!`;
        }
    }
}
