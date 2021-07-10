const ChessModule = require("chess.js");
const Chess = ChessModule.Chess ? ChessModule.Chess : ChessModule;

// random chess game
// chess = new Chess();
// while (!chess.game_over()) {
//     const moves = chess.moves()
//     const move = moves[Math.floor(Math.random() * moves.length)]
//     chess.move(move)
// }
// console.log(chess.pgn())


// a full chess game
chess = new Chess();
moves = ["b3", "g5", "h4", "Bg7", "Nc3", "Nc6", "Rh3", "Kf8", "Rh1", "f6", "Rb1", "a6", "Nb5", "Na5", "hxg5", "Nh6", "g4", "Nf5", "e3", "h6", "e4", "Rh7", "c3", "e6", "Nh3", "Nxb3", "Qf3", "Qe8", "Ke2", "Kf7", "Kd3", "Qf8", "gxh6", "Qc5", "Nd4", "Kg6", "Rb2", "Qf8", "Qxf5+", "Kxh6", "Nf4#"]

for (let i = 0; i < moves.length; i++) {
    // console.log(`Move ${i}...`);
    chess.move(moves[i]);
}
console.log(chess.ascii());
console.log(`Game over: ${chess.game_over()}`);
console.log(`Checkmate: ${chess.in_checkmate()}`);
console.log(`Loser (if in checkmate): ${chess.turn()}`);


// a chess board position
// chess = new Chess("r1k4r/p2nb1p1/2b4p/1p1n1p2/2PP4/3Q1NB1/1P3PPP/R5K1 b - c3 0 19");
// console.log(chess.ascii());


// result = [150,0];
// console.log(JSON.stringify(result));
