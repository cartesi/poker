module.exports = {
    packagerConfig: {},
    makers: [
        {
            name: "@electron-forge/maker-squirrel",
            config: {
                name: "electron_app",
            },
        },
        {
            name: "@electron-forge/maker-zip",
            platforms: ["darwin"],
        },
        {
            name: "@electron-forge/maker-deb",
            config: {},
        },
        {
            name: "@electron-forge/maker-rpm",
            config: {},
        },
    ],
    plugins: [
        [
            "@electron-forge/plugin-webpack",
            {
                devContentSecurityPolicy:
                    "default-src 'self' 'unsafe-inline' *.portis.io; img-src blob: data: http://localhost; script-src 'self' 'unsafe-eval' 'unsafe-inline'",
                mainConfig: "./webpack.main.config.js",
                renderer: {
                    config: "./webpack.renderer.config.js",
                    entryPoints: [
                        {
                            html: "./src/index.html",
                            js: "./src/app.ts",
                            name: "main_window",
                        },
                    ],
                },
            },
        ],
    ],
};
