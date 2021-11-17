const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");

const dest = process.env.NODE_ENV == "development" ? ".webpack/renderer" : ".webpack/renderer/main_window";
const copyPlugins = new CopyPlugin({
    patterns: [
        {
            from: path.resolve(__dirname, "../webapp/assets"),
            globOptions: {
                ignore: ["**/audio/*mp3", "**/audio/*ogg"],
            },
            to: path.resolve(__dirname, dest, "assets"),
        },
        {
            from: path.resolve(__dirname, "../webapp/assets/audio"),
            globOptions: {
                ignore: ["**/*json"],
            },
            to: path.resolve(__dirname, ".webpack/renderer", "assets/audio"),
        },
    ],
});

module.exports = [new ForkTsCheckerWebpackPlugin(), copyPlugins];
