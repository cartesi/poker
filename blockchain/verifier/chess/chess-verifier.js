const BigNumber = require("bignumber.js");
const ChessModule = require("chess.js");
const Chess = ChessModule.Chess ? ChessModule.Chess : ChessModule;

// funds at stake for a normal game
const GAME_STAKE = new BigNumber(10);

// verify chess game given provided turn-based-game input
function run(inputs) {
    // initializes chess game
    chess = new Chess();

    // retrieves moves from turn data given as null terminated strings
    moves = inputs.turns.map(turn => String.fromCharCode.apply(null, turn.slice(0, turn.indexOf(0))));
    // moves = ["b3", "g5", "h4", "Bg7", "Nc3", "Nc6", "Rh3", "Kf8", "Rh1", "f6", "Rb1", "a6", "Nb5", "Na5", "hxg5", "Nh6", "g4", "Nf5", "e3", "h6", "e4", "Rh7", "c3", "e6", "Nh3", "Nxb3", "Qf3", "Qe8", "Ke2", "Kf7", "Kd3", "Qf8", "gxh6", "Qc5", "Nd4", "Kg6", "Rb2", "Qf8", "Qxf5+", "Kxh6", "Nf4#"];

    // executes chess moves 
    // - aborts if an illegal move was requested and punishes the move's author
    console.log(`\nExecuting chess moves: ${JSON.stringify(moves)}`);
    for (let i = 0; i < moves.length; i++) {
        const player = inputs.turnPlayers[i];
        const expectedPlayer = inputs.players[i%2];
        if (player !== expectedPlayer) {
            console.log(`Player '${player}' submitted move ${i} ('${moves[i]}') when it wasn't his turn.`);
            return computeResultPunish(inputs, player);
        }
        const nextPlayer = inputs.turnNextPlayers[i];
        const expectedNextPlayer = inputs.players[(i+1)%2];
        if (nextPlayer !== expectedNextPlayer) {
            console.log(`Player '${player}' submitted move ${i} ('${moves[i]}') with invalid nextPlayer '${nextPlayer}' (should be '${expectedNextPlayer}').`);
            return computeResultPunish(inputs, player);
        }
        const stake = inputs.turnPlayerStakes[i];
        if (!stake.eq(GAME_STAKE)) {
            console.log(`Player '${player}' submitted move ${i} ('${moves[i]}') with invalid stake '${stake}' (should be '${GAME_STAKE}').`);
            return computeResultPunish(inputs, player);
        }
        if (!chess.move(moves[i])) {
            console.log(`Invalid move ${i} ('${moves[i]}') from player '${player}'`);
            return computeResultPunish(inputs, player);
        }
    }

    // prints final chess board
    console.log(`\nFinal board:`);
    console.log(chess.ascii());

    // checks if game is over and there is a claim
    if (!chess.game_over()) {
        if (!inputs.claimer) {
            console.log(`Game is not over, there are no illegal moves and no claim has been placed: will punish challenger '${inputs.challenger}'`);
            return computeResultPunish(inputs, inputs.challenger);
        } else {
            console.log(`Game is not over, there are no illegal moves, but there is a claim: will punish claimer '${inputs.claimer}'`);
            return computeResultPunish(inputs, inputs.claimer);
        }
    } else if (!inputs.claimer) {
        console.log(`Game is over with no illegal moves but no claim has been placed yet: will punish challenger '${inputs.challenger}' for not waiting for a claim first`);
        return computeResultPunish(inputs, inputs.challenger);
    }

    // game is over and there is a claim: compute result and compare with claim
    if (chess.in_checkmate()) {
        // side to move has been checkmated
        const [loser, winner] = chess.turn() == 'w' ? [0,1] : [1,0];
        result = computeResultWinner(inputs, winner, loser);
        console.log(`Game over in checkmate. Winner is '${inputs.players[winner]}'.`);
    } else {
        console.log(`Game over in draw. Players should retain their funds.`)
        result = inputs.playerFunds;
    }
    console.log(`Expected result is ${JSON.stringify(result)}`);
    console.log(`Claimed result is ${JSON.stringify(inputs.claimedFundsShare)}`);
    if (JSON.stringify(result) === JSON.stringify(inputs.claimedFundsShare)) {
        console.log(`Claimed result is correct: will punish challenger '${inputs.challenger}'.`);
        return computeResultPunish(inputs, inputs.challenger);
    } else {
        console.log(`Claimed result is incorrect: will punish claimer '${inputs.claimer}'.`);
        return computeResultPunish(inputs, inputs.claimer);
    }
}

// computes result when there is a winner and a loser
function computeResultWinner(inputs, winner, loser) {
    // correct result is that loser should give 10% of his funds to the winner
    const result = new Array(2)
    result[loser] = inputs.playerFunds[loser].minus(GAME_STAKE);
    result[winner] = inputs.playerFunds[winner].plus(GAME_STAKE);
    return result;
}

// computes result by punishing a given player
// - punished player will lose all of his funds, half of which will be given to his opponent
function computeResultPunish(inputs, playerToBlame) {
    if (inputs.players[0] === playerToBlame) {
        return [new BigNumber(0), inputs.playerFunds[0].idiv(2).plus(inputs.playerFunds[1])];
    } else {
        return [inputs.playerFunds[0].plus(inputs.playerFunds[1].idiv(2)), new BigNumber(0)];
    }
}

module.exports = { run };
