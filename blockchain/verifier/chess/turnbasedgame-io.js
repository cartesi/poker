const BigNumber = require("bignumber.js");


// loads fs only when running on node.js
const nodeVer = typeof process !== "undefined" && process.versions?.node;
const nodeRequire = nodeVer
  ? typeof __webpack_require__ === "function"
    ? __non_webpack_require__
    : require
  : undefined;
let fs;
if (nodeVer) {
    fs = nodeRequire("fs");
}

// converts a Uint8Array into a hex string
function buf2hex(buffer) {
    return "0x" + Array.prototype.map
        .call(buffer, x => x.toString(16).padStart(2, '0'))
        .join('');
}

// converts a hex string into a Uint8Array
function hex2buf(hex) {
    if (hex.startsWith("0x")) {
        hex = hex.slice(2);
    }
    const buf = new Uint8Array(hex.length/2);
    for (let i = 0; i < buf.length; i++) {
        buf[i] = parseInt("0x" + hex.slice(i*2, i*2+2));
    }
    return buf;
}


// FILE I/O METHODS SUPPORTING BOTH NODEJS AND QUICKJS

// opens the given file for reading, returning its descriptor/handle
function openFile(filename, mode) {
    let file;
    if (!mode) {
        mode = "r";
    }
    if (fs) {
        // uses node's fs
        file = fs.openSync(filename, mode);
    } else if (std) {
        // uses qjs' std
        file = std.open(filename, mode);
    }
    if (!file) {
        throw `Could not open ${filename}`;
    }
    return file;
}

// closes the given file
function closeFile(file) {
    if (fs) {
        // uses node's fs
        fs.closeSync(file);
    } else if (std) {
        // uses qjs' std
        file.close();
    }
}

// reads data from a file and stores it in the provided buffer
function readData(file, buffer, start, end, msg) {
    const length = end - start;
    let bytesRead;
    if (fs) {
        // uses node's fs
        bytesRead = fs.readSync(file, Buffer.from(buffer), 0, length, start);
    } else if (std) {
        // uses qjs' std
        file.seek(start, std.SEEK_SET);
        bytesRead = file.read(buffer, 0, length);
    }
    if (bytesRead !== length) {
        throw msg;
    }
    return new Uint8Array(buffer).slice(0, bytesRead);
}

// writes a Uint8Array data to a file
function writeData(file, data, msg) {
    if (fs) {
        // uses node's fs
        bytesWritten = fs.writeSync(file, data);
    } else if (std) {
        // uses qjs' std
        bytesWritten = file.write(data.buffer, 0, data.length);
    }
    if (bytesWritten !== data.length) {
        throw msg;
    }
}


// READS PLAYERS INFO
function readPlayers(inputs, filename) {
    const file = openFile(filename);
    const buffer = new ArrayBuffer(32);
    let data;

    // number of players: 4 bytes
    data = readData(file, buffer, 0, 4, "Could not read number of players");
    inputs.nPlayers = new BigNumber(buf2hex(data)).toNumber();

    // player addresses: 32 bytes each, of which 20 bytes is the address itself and the rest is padding
    inputs.players = [];
    let start = 4;
    for (let i = 0; i < inputs.nPlayers; i++) {
        const end = start + 32;
        data = readData(file, buffer, start+12, end, `Could not read address for player ${i}`);
        inputs.players[i] = buf2hex(data);
        start = end;
    }

    // player funds: 32 bytes each
    inputs.playerFunds = [];
    for (let i = 0; i < inputs.nPlayers; i++) {
        const end = start + 32;
        data = readData(file, buffer, start, end, `Could not read funds for player ${i}`);
        inputs.playerFunds[i] = new BigNumber(buf2hex(data));
        start = end;
    }
    closeFile(file);
}


// READS TURNS METADATA
function readTurnsMetadata(inputs, filename) {
    const file = openFile(filename);
    const buffer = new ArrayBuffer(32);
    let data;

    // number of turns: 4 bytes
    data = readData(file, buffer, 0, 4, "Could not read number of turns");
    inputs.nTurns = new BigNumber(buf2hex(data)).toNumber();

    // turn authors (addresses of the players who submitted each turn): 32 bytes each, of which 20 bytes is the address itself and the rest is padding
    inputs.turnAuthors = [];
    let start = 4;
    for (let i = 0; i < inputs.nTurns; i++) {
        const end = start + 32;
        data = readData(file, buffer, start+12, end, `Could not read author for turn ${i}`);
        inputs.turnAuthors[i] = buf2hex(data);
        start = end;
    }

    // turn timestamps: 32 bytes each
    inputs.turnTimestamps = [];
    for (let i = 0; i < inputs.nTurns; i++) {
        const end = start + 32;
        data = readData(file, buffer, start, end, `Could not read timestamp for turn ${i}`);
        inputs.turnTimestamps[i] = new BigNumber(buf2hex(data));
        start = end;
    }

    // turn sizes: 32 bytes each
    inputs.turnSizes = [];
    for (let i = 0; i < inputs.nTurns; i++) {
        const end = start + 32;
        data = readData(file, buffer, start, end, `Could not read size for turn ${i}`);
        inputs.turnSizes[i] = new BigNumber(buf2hex(data)).toNumber();
        start = end;
    }
    closeFile(file);
}


// READS TURNS DATA
function readTurnsData(inputs, filename) {
    const file = openFile(filename);
    if (!inputs.nTurns) {
        throw "Should only read turns data after reading turns metadata, to know how many turns to expect";
    }

    inputs.turns = [];
    let start = 0;
    for (let i = 0; i < inputs.nTurns; i++) {
        const size = inputs.turnSizes[i];
        if (!size) {
            throw `Missing size metadata information for turn ${i}`;
        }
        const buffer = new ArrayBuffer(size);
        const end = start + size;
        inputs.turns[i] = readData(file, buffer, start, end, `Could not read data for turn ${i}`);
        start = end;
    }
    closeFile(file);
}


// READS VERIFICATION INFO
function readVerificationInfo(inputs, filename) {
    if (!inputs.nPlayers) {
        throw "Should only read verificationInfo after reading player information, to know how many players are in the game";
    }
    const file = openFile(filename);
    const buffer = new ArrayBuffer(32);
    let data;

    // challenger address: 20 bytes
    data = readData(file, buffer, 0, 20, "Could not read challenger address");
    inputs.challenger = buf2hex(data);

    // claimer address: 20 bytes
    data = readData(file, buffer, 20, 40, "Could not read claimer address");
    const claimer = buf2hex(data);
    if (claimer !== "0x0000000000000000000000000000000000000000") {
        // there is a claim
        // - claim corresponds to an array of funds to be given back to each player: 32 bytes each
        inputs.claimer = claimer;
        inputs.claimedFundsShare = [];
        let start = 40;
        for (let i = 0; i < inputs.nPlayers; i++) {
            const end = start + 32;
            data = readData(file, buffer, start, end, `Could not read claimed funds share for player ${i}`);
            inputs.claimedFundsShare[i] = new BigNumber(buf2hex(data));
            start = end;
        }
    }
    closeFile(file);
}


// READS ALL INPUTS FROM EXPECTED FILES
function readInputs() {
    inputs = {};
    readPlayers(inputs, "players.raw");
    readTurnsMetadata(inputs, "turnsMetadata.raw");
    readTurnsData(inputs, "turnsData.raw");
    readVerificationInfo(inputs, "verificationInfo.raw");
    return inputs;
}


// WRITES OUTPUT RESULT TO EXPECTED FILE
function writeOutput(result) {
    if (!result || !result.length) {
        throw `Result must be an array of funds to be shared among the players, but got ${JSON.stringify(result)}`;
    }
    const file = openFile("output.raw", "w");
    for (let value of result) {
        if (isNaN(value)) {
            throw `Result entries must be numbers, but got ${JSON.stringify(value)}`;
        }
        const hex = value.toString(16).padStart(64, "0");
        const data = hex2buf(hex);
        writeData(file, data, `Error writing data '${JSON.stringify(result)}' to output file 'output.raw'`);
    }
    closeFile(file);
}


module.exports = { readInputs, writeOutput }
