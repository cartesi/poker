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
    publishers: [
        {
            name: "@electron-forge/publisher-github",
            config: {
                repository: {
                    owner: "cartesi-corp",
                    name: "poker",
                },
                draft: true,
                prerelease: false,
                authToken: process.env.GITHUB_TOKEN,
            },
        },
    ],
    makers: [
        {
            name: "@electron-forge/maker-squirrel",
            config: {
                authors: "Cartesi Foundation Ltd.",
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
            config: {
                options: {
                    categories: ["Game"],
                    homepage: "https://cartesi.io/",
                    icon: "icons/icon_512.png",
                    maintainer: "Cartesi Foundation Ltd.",
                },
            },
        },
        {
            name: "@electron-forge/maker-rpm",
            config: {
                options: {
                    categories: ["Game"],
                    homepage: "https://cartesi.io/",
                    icon: "icons/icon_512.png",
                    maintainer: "Cartesi Foundation Ltd.",
                },
            },
        },
    ],
};
