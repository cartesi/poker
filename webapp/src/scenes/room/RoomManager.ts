export class RoomManager {

    public static games: any[];

    public static init(): void {

        const alice_tx = new Transport();
        const bob_tx = new Transport();  
        const alice_funds = 100;
        const bob_funds = 100;
        const metadata = "";  

        const alice = new Game(
            ALICE, alice_funds, bob_funds, metadata, alice_tx,
            () => RoomManager.onBetRequested,
            () => RoomManager.onEnd,
            (msg) => {console.log(msg)}
        );

        const bob = new Game(
            BOB, alice_funds, bob_funds, metadata, bob_tx,
            () => RoomManager.onAutomaticBet(BOB)
        );

        alice_tx.connect(bob_tx);

        RoomManager.games = [];
        RoomManager.games.push(alice);
        RoomManager.games.push(bob);

        alice.start();
        bob.start();
    }

    private static onBetRequested() {

        // 
    }

    private static onEnd() {
        
        // 
    }

    private static onAutomaticBet(player) {

        setTimeout(() => {
            if (RoomManager.games[player]) {
                let choices = [0,1,2,3];
                while (true) {
                    let i = Math.floor(Math.random()*choices.length);
                    let choice = choices[i];
                    try {
                        if (choice == 0) {
                            RoomManager.games[player].call();
                        } else if (choice == 1) {
                            RoomManager.games[player].check();
                        } else if (choice == 2) {
                            RoomManager.games[player].fold();
                        } else if (choice == 3) {
                            let amount = Math.floor(Math.random()*5);
                            RoomManager.games[player].raise(amount);
                        }
                        break;
                    } catch (e) {
                        // bet choice not allowed, remove that possibility and try again
                        choices.splice(i, 1);
                    }
                }
            }
        }, 1000);
    }
}