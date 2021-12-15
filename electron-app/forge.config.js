module.exports = {
    packagerConfig: {
        icon: "icons/icon_512",
    },
    makers: [
        {
            name: "@electron-forge/maker-squirrel",
            config: {
                name: "cartesi-texas-hodlem",
            },
        },
        {
            name: "@electron-forge/maker-zip",
        },
        {
            name: "@electron-forge/maker-dmg",
            config: {
                format: "ULFO",
            },
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
};
