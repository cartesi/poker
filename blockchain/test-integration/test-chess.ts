import hre from "hardhat";

async function main() {
    const moves = ["b3", "g5", "h4", "Bg7", "Nc3", "Nc6", "Rh3", "Kf8", "Rh1", "f6", "Rb1", "a6", "Nb5", "Na5", "hxg5", "Nh6", "g4", "Nf5", "e3", "h6", "e4", "Rh7", "c3", "e6", "Nh3", "Nxb3", "Qf3", "Qe8", "Ke2", "Kf7", "Kd3", "Qf8", "gxh6", "Qc5", "Nd4", "Kg6", "Rb2", "Qf8", "Qxf5+", "Kxh6", "Nf4#"];
    console.log(`Playing chess game with moves: ${JSON.stringify(moves)}`);

    const players = ["alice", "bob"];

    let index = await hre.run("start-game", { hash: "0x8d1eb708bc02d459eb10d35705a54aee412a88c9a7ebdd3c24036db1ea779060"});
    index = index.toNumber();

    for (let i = 0; i < moves.length; i++) {
        const player = players[i%2];
        const datastr = moves[i];
        await hre.run("submit-turn", { index, player, datastr });
    }
    
    // bob is in checkmate but will try to claim victory (10% of alice's stake)
    await hre.run("claim-result", { index, player: "bob", result: [90,110] });

    // alice challenges, and a verification is triggered using Descartes
    await hre.run("challenge-game", { index, player: "alice" });

    // wait for Descartes to finish the verification computation
    await hre.run("wait-verification", { index });

    // apply the final result computed by the Descartes verification: bob will lose all his funds (50% will go to alice and the rest is burned)
    const result = await hre.run("apply-result", { index });
    console.log(`Final result: ${result}\n`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });