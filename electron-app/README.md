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

After preparing the application, run the application using one of the following methods:

- `yarn start`, to run _Poker_ against a [local Descartes environment](../blockchain/descartes-env/)
- `yarn matic:start`, to run _Poker_ against the Mumbai Matic Testnet
- `yarn dev`, to run _Poker_ in development mode

As an example, in order to prepare and execute the application on localhost using a MacOS engine, do as follows:

```shell
$ yarn macos:prepare && yarn start
```

## Packaging

Electron allows for the generation of application binaries via electron-packager.
We have used Electron Forge scaffolding features to [perfom that](https://www.electronforge.io/cli#package).

Before packaging the application, choose what engine wil be used, as explained above.
Then execute the actual packaging.

As an example, in order to package an application with a MacOS engine, do as follows:

```shell
$ yarn macos:prepare && yarn package
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

## Making Distributables

We also use Electron Forge to [make distributables](https://www.electronforge.io/cli#make) for the application.

In order to make distributables, just run:

```shell
$ yarn make
```

**Note:**
Please ignore the warning `electron-forge` shows during the process.
It is due to the fact that the `make` script runs `electron-forge` with `--skip-package` activate and runs the `package` script explicitily to make sure all dependencies are ready before making a distributable.

The resulting files should be available under directory `out/make/`.
The actual file names will depend on the platform being used to build the application and the target format.

For example, on a MacOS, a file for the default target (zip) should be available at `out/make/zip/darwin/x64/cartesi-poker-darwin-x64-1.0.0.zip`.
