const BigNumber = require("bignumber.js");
const ChessModule = require("chess.js");
const Chess = ChessModule.Chess ? ChessModule.Chess : ChessModule;

// verify chess game given provided turn-based-game input
function run(inputs) {
    chess = new Chess();

    // retrieves moves from turn data given as null terminated strings
    moves = inputs.turns.map(turn => String.fromCharCode.apply(null, turn.slice(0, turn.indexOf(0))));
    // moves = ["b3", "g5", "h4", "Bg7", "Nc3", "Nc6", "Rh3", "Kf8", "Rh1", "f6", "Rb1", "a6", "Nb5", "Na5", "hxg5", "Nh6", "g4", "Nf5", "e3", "h6", "e4", "Rh7", "c3", "e6", "Nh3", "Nxb3", "Qf3", "Qe8", "Ke2", "Kf7", "Kd3", "Qf8", "gxh6", "Qc5", "Nd4", "Kg6", "Rb2", "Qf8", "Qxf5+", "Kxh6", "Nf4#"];

    console.log(`Executing chess moves: ${JSON.stringify(moves)}`);
    for (let i = 0; i < moves.length; i++) {
        chess.move(moves[i]);
    }
    console.log(`Final board:`);
    console.log(chess.ascii());
    console.log(`Game over: ${chess.game_over()}`);
    console.log(`Checkmate: ${chess.in_checkmate()}`);
    console.log(`Loser (if in checkmate): ${chess.turn()}`);

    if (chess.turn() == 'w') {
        return [new BigNumber(0), inputs.playerFunds[0].idiv(2).plus(inputs.playerFunds[1])];
    } else {
        return [inputs.playerFunds[0].plus(inputs.playerFunds[1].idiv(2)), new BigNumber(0)];
    }
}

module.exports = { run };
