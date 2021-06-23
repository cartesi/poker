var path = require("path");

module.exports = {
    entry: "./src/app.ts",
    devtool: "source-map",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bundle.js",
    },
    module: {
        rules: [
            { test: /\.ts$/, loader: "ts-loader", exclude: "/node_modules/" },
            {
                test: /\/static\/.*/,
                use: {
                    loader: "file-loader",
                    options: {
                        name: "[path][name].[ext]",
                    },
                },
            },
        ],
    },
    devServer: {
        contentBase: path.resolve(__dirname, "./"),
        publicPath: "/dist/",
        host: "localhost",
        port: 3000,
        open: true,
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
};
