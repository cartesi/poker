import { ServiceConfig, ServiceType, ServiceImpl } from "./ServiceConfig";
import { TransportMock } from "./mock/TransportMock";
// import { TransportWeb3 } from "./web3/TransportWeb3";

export interface Transport {
    connect(other: Transport);
    send(data: any, callback?: (any) => any);
    receive(callback: (any) => any);
}

export class TransportFactory {
    /**
     * Creates a new Transport instance based on service configuration
     *
     * @returns the Transport instance
     */
    public static create(): Transport {
        const impl = ServiceConfig.get(ServiceType.Transport);
        if (impl === ServiceImpl.Mock) {
            // mock transport
            return new TransportMock();
        } else if (impl == ServiceImpl.Web3) {
            // web3 transport
            // TODO: Web3 Transport not supported yet!
            return new TransportMock();
            // return new TransportWeb3();
        } else {
            // unknown implementation configured
            throw `Unknown transport configuration '${impl}'!`;
        }
    }
}
