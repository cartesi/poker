# Release

A high level description of the release workflow consist of four steps:

1. Application is packaged
2. Package is code-signed (macOS/Windows)
3. Package is notarized (macOS)
4. A new release and tag is created on Github, containing the generated installers

To provide automatic updates, we're currently using the [update-electron-app](https://github.com/electron/update-electron-app) plugin/module.

## Instructions

No matter the host OS, the machine generating the release must be configured with the `GITHUB_TOKEN` environment variable containing an [access token](https://github.com/settings/tokens/new). It'll be used by `@electron-forge/publisher-github` to connect with the Github API and create the releases. They'll be created as a drafts and **must be published manually** to become public.

### MacOS

#### Configuration

Some files and environment variables are needed:

1. A `Developer ID Application` certificate
It needs to be on the machine's default keychain. Should be handled with care, as this is highly sensitive data.
2. `APPLE_ID` and `APPLE_ID_PASSWORD`
These two environment variables should contain a valid Apple ID and an app-specific password (instructions on how to generate one [here](https://support.apple.com/en-us/HT204397)). They're used during the code-signing/notarization process.

**Obs**: there are two notarization methods in `electron-notarize`: legacy and notarytool. The latter is faster but proved unreliable while testing. We've opted for the (default) legacy option for now.

#### Steps

If everything is configured properly, to create a MacOS release all you need to do is run:

```shell
yarn macos:publish
```

This will create, code-sign and notarize a `.app` and generate a `.dmg` installer which will be attached to the Github Release.

**Obs:** a warning similar to this maybe be shown during the code-signing step:

```shell
WARNING: Code sign failed; please retry manually. Error: Command failed: spctl --assess --type execute --verbose --ignore-cache --no-cache /var/folders/.../cartesi-texas-hodlem.app
/var/folders/.../cartesi-texas-hodlem.app: rejected
source=Unnotarized Developer ID
```

Fret not: this failure is expected. The notarization check happens before notarization actually takes place and is [probably](https://developer.apple.com/forums/thread/697306) old code that needs to be updated.

### Windows

TODO

### Linux

TODO
