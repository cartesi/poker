module.exports = {
    packagerConfig: {
        icon: "icons/icon_512",
        osxSign: {
            identity: "Developer ID Application: Cartesi Pte. Ltd. (3S3FTC59U9)",
            "hardened-runtime": true,
            entitlements: "entitlements.plist",
            "entitlements-inherit": "entitlements.plist",
        },
        osxNotarize: {
            appleId: process.env.APPLE_ID,
            appleIdPassword: process.env.APPLE_ID_PASSWORD,
        },
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
                icon: "icons/icon_512.icns",
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
