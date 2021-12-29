const copyfiles = require("copyfiles");
const mkdirp = require("mkdirp");
const platform = require("platform-detect");

const engines = new Map([
    [
        "linux",
        [
            ["../engine/platforms/x64/build/poker-lib/*.ts", "src/services/engine"],
            ["../engine/platforms/x64/build/poker-lib/pokerlib.node", "dist/assets/engine"],
            ["../engine/platforms/x64/build/poker-lib/*.so*", "dist/assets/engine"],
        ],
    ],
    [
        "macos",
        [
            ["../engine/poker-lib/node-addon/src/*.ts", "src/services/engine"],
            ["./lib/darwin_x64/*", "dist/assets/engine"],
        ],
    ],
    [
        "wasm",
        [
            ["../engine/platforms/wasm/build/poker-lib/*.ts", "src/services/engine"],
            ["../engine/platforms/wasm/build/lib/poker-lib-wasm.*", "dist/assets/engine"],
        ],
    ],
    [
        "windows",
        [
            ["../engine/poker-lib/node-addon/src/*.ts", "src/services/engine"],
            ["./lib/windows/*", "dist/assets/engine"],
        ],
    ],
]);

function copy(engine) {
    if (!engine) {
        if (platform.linux) {
            engine = "linux";
        } else if (platform.macos) {
            engine = "macos";
        } else if (platform.windows) {
            engine = "windows";
        }
    }

    let paths = engines.get(engine);
    if (typeof paths === "undefined") {
        console.error(engine + " engine does not exist");
        return;
    }

    mkdirp("src").then(
        mkdirp("dist").then(() => {
            paths.forEach(function (path) {
                copyfiles(path, true, function (err) {
                    if (err) console.error(err);
                });
            });
            console.log("Copied " + engine + " engine files");
        })
    );
}

let engine = process.env.POKER_ENGINE;
const args = process.argv.slice(2);
if (args[0] != null) engine = args[0];
copy(engine);
