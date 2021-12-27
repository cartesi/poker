# Poker Electron App

Desktop version of the [Texas HODL'em Poker](../README.md).
It's basically a port of the [webapp](../webapp/README.md) version to the [Electron](https://www.electronjs.org/) framework.

It also depends on the `Descartes Environment` being properly set up as defined in the [project documentation](../README.md#Environment).

## Deployment and Execution

The process is quite different from [the one available in the webapp](../webapp/README.md#deploying-and-running) version of the application.

First of all, you should choose which engine you'd like to use along with the application in order to prepare it for execution. You can use any one of the options below:

- `yarn prepare` to deploy the default WASM engine commited at `webapp`
- `yarn wasm:prepare` to deploy the [most recent WASM engine build available in the workspace](../engine/platforms/wasm/)
- `yarn linux:prepare` to deploy the [most recent x64 engine build available in the workspace](../engine/platforms/x64)
- `yarn macos:prepare` to deploy the [MacOS engine commited in the project](./lib/darwin_x64)
- `yarn windows:prepare` to deploy the [Windows engine commited in the project](./lib/windows)

After preparing the application, run the application using one of the following methods:

- `yarn start`, to run _Poker_ against a [local Descartes environment](../blockchain/descartes-env/)
- `yarn matic:start`, to run _Poker_ against the Mumbai Matic Testnet
- `yarn dev`, to run _Poker_ in development mode
- `yarn dev:mock`, to run _Poker_ in development but in full mock mode (query string: `?mock`)
- `yarn dev:transportmock`, to run _Poker_ in development mode, but using a _mock_ transport with no encryption (query string: `?transport=mock&encryption=off`)

As an example, in order to prepare and execute the application on localhost using a MacOS engine, do as follows:

```shell
$ yarn macos:prepare
$ yarn start
```

## Packaging

Electron allows for the generation of application binaries via electron-packager.
We have used Electron Forge scaffolding features to [perfom that](https://www.electronforge.io/cli#package).

Before packaging the application, choose what engine wil be used, as explained above.
Then execute the actual packaging.

As an example, in order to package an application with a Windows engine, do as follows:

```shell
$ yarn windows:prepare
$ yarn package
```

The application contents are going to be available under directory `out/`.
The actual tree will depend on the platform being used.

For example, for MacOS, the application executable will be generated at `out/cartesi-texas-hodlem-darwin-x64/cartesi-texas-hodlem.app/Contents/MacOS/cartesi-texas-hodlem`.

Also, the application assets, etc., will be available under `out/cartesi-poker-darwin-x64/cartesi-poker.app/Contents/Resources/app/.

In order to run the packaged app, simply run the executable.
For MacOS, do as follows:

```shell
$ ./out/cartesi-texas-hodlem-darwin-x64/cartesi-texas-hodlem.app/Contents/MacOS/cartesi-texas-hodlem
```

### Mock mode

The available mock modes may also be activated via the executable.
In order to do it, simply execute the binary passing either `mock` or `transport_mock` as an argument.

Examnle:

```shell
$ ./out/cartesi-texas-hodlem-darwin-x64/cartesi-texas-hodlem.app/Contents/MacOS/cartesi-texas-hodlem mock
```

## Making Distributables

We also use Electron Forge to [make distributables](https://www.electronforge.io/cli#make) for the application.

In order to make distributables, just run:

```shell
$ yarn make
```

**Note:**
Please ignore the log message `WARNING: Skipping the packaging step, this could result in an out of date build` shown during the process.
It is due to the fact that the `make` script runs `electron-forge` with `--skip-package` activated and runs the `package` script explicitily to make sure all dependencies are ready before making any distributable.

**Note:**
In order to create `.deb` packages, the name attribute in `package.json` must meet [`MakeDebConfig` requirements](https://js.electronforge.io/maker/deb/interfaces/makerdebconfigoptions.html#name). That's why it's changed before the `make` script starts and is restored after `make` is complete.

The resulting files should be available under directory `out/make/`.
The actual file names will depend on the platform being used to build the application and the target format.

The available targets are:

- `deb` (only available on Linux): creates a Debian package and make it available under `out/make/deb/`. Check [Electron Forge documentation](https://www.electronforge.io/config/makers/deb) for usage;
- `dmg` (only available on MacOS): creates a MacOS installer and make it available under `out/make/`. Check [Electron Forge documentation](https://www.electronforge.io/config/makers/dmg) for usage;
- `rpm` (only available on Linux): creates a RedHat-based package and make it available under `out/make/rpm/`. Check [Electron Forge documentation](https://www.electronforge.io/config/makers/rpm) for usage;
- `squirrel.windows` (only available on Windows and MacOS MacOS): creates a Windows installer. Check [Electron Forge documentation](https://www.electronforge.io/config/makers/squirrel.windows) for usage;
- `zip`: creates a zip package and make it available under `out/make/zip/`.
