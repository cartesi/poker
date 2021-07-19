const ChessVerifier = require("./chess-verifier.js");
const TurnBasedGameIO = require("./turnbasedgame-io.js");

// reads game inputs
const inputs = TurnBasedGameIO.readInputs();

// computes chess result based on inputs
const result = ChessVerifier.run(inputs);

// writes result to output
TurnBasedGameIO.writeOutput(result);
console.log(`Result: ${JSON.stringify(result)}`);
