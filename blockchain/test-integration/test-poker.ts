import hre from "hardhat";
import * as fs from "fs";

/*
This script uses the turn based game contract to run and verify a poker game.
It sends to the contract a complete set of game turns previously saved in files and triggers the C++ game verifier.

1. Make sure that the C++ poker engine is built for platforms x64 and risc-v. You only need to do this once.
   cd /<poker-base>/engine/platforms/x64
   make
   cd /<poker-base>/engine/platforms/risc-v
   make

4. Build the cartesi machine that will be used when the descartes verification is triggered. You only need to do this once.
   cd /<poker-base>/engine/platforms/risc-v
   make machine

3. Generate a poker game and save the turns in files
   cd /<poker-base>/engine/platforms/x64
   make generate

4. Run the game
   cd /<poker-base>/blockchain
   npx hardhat --network localhost run --no-compile ./test-integration/test-poker.ts
*/

async function main() {
  const engineDir = `${__dirname}/../../engine`;
  const gameDir = `${engineDir}/platforms/.xfer`;
  const files = fs.readdirSync(gameDir).filter(s => s.match(/turn-\d+-\d.raw/) ).sort();  
  
  const machineDir = `${__dirname}/../descartes-env/machines`;
  const machineHash = "0x" + fs.readdirSync(machineDir).slice(-1)[0];
  console.log('Machine hash is ', machineHash);
  
  let index = await hre.run("start-game", { hash: machineHash})
  index = index.toNumber()  
  const players = ['alice', 'bob']
    
  for(let i=0; i<files.length; i++) {
    const f = files[i];
    const p = f.match(/turn-\d+-(\d).raw/)[1];
    const player = players[p];
    const turnFile = `${gameDir}/${f}`;
    const bytes = fs.readFileSync(turnFile);
    const data = "0x" + bytes.toJSON().data.map(d => ("0"+Number(d).toString(16)).slice(-2).toUpperCase()).join("");
    console.log(`=== ${player} == submit turn ${f} ==== ${data.length}`);
    await hre.run("submit-turn", { index, player, data });
  }

  await hre.run("claim-result",   { index, player: "bob", result: [90,110] });
  await hre.run("challenge-game", { index, player: "alice" });
  await hre.run("wait-verification", { index });
  const result = await hre.run("apply-result", { index });
  console.log('---->', result)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
