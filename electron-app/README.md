# Poker Electron App

Desktop version of the [Texas HODL'em Poker](../README.md).
It's basically a port of the [webapp](../webapp/README.md) version to the [Electron](https://www.electronjs.org/) framework.

It also depends on the `Descartes Environment` being properly set up as defined in the [project documentation](../README.md#Environment).

## Deployment and Execution

The application can be deployed an executed using one of the following methods:

- `yarn start`, to run _Poker_ against a [local Descartes environment](../blockchain/descartes-env/)
- `yarn matic:start`, to run _Poker_ against the Mumbai Matic Testnet
- `yarn dev`, to run _Poker_ in development mode
- `yarn dev:mock`, to run _Poker_ in development but in full mock mode (query string: `?mock`)
- `yarn dev:transportmock`, to run _Poker_ in development mode, but using a _mock_ transport with no encryption (query string: `?transport=mock&encryption=off`)

The Poker engine to be used will be detected automatically based on the platform being used. 
However, one can force a specific engine by exporting the environment variable `POKER_ENGINE` before running the application as follows:

```shell
$ export POKER_ENGINE=wasm
$ yarn matic:start
```

Possible values are:

- `macos`
- `windows`
- `linux`
- `wasm`

**Note:**
The `wasm` engine is the only one that MUST be forced to be used as any native alternative engine will take precedence over it if `POKER_ENGINE` is not defined.

## Packaging

Electron allows for the generation of application binaries via electron-packager.
We have used Electron Forge scaffolding features to [perfom that](https://www.electronforge.io/cli#package).

In order to package an application, simply do as follows:

```shell
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

Example:

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
In order to create `.deb` packages, the name attribute in `package.json` must meet [`MakeDebConfig` requirements](https://js.electronforge.io/maker/deb/interfaces/makerdebconfigoptions.html#name). That's why it's changed before the `make` script starts and is restored after `make` is complete.

The resulting files should be available under directory `out/make/`.
The actual file names will depend on the platform being used to build the application and the target format.

The available targets are:

- `deb` (only available on Linux): creates a Debian package. Check [Electron Forge documentation](https://www.electronforge.io/config/makers/deb) for usage;
- `dmg` (only available on MacOS): creates a MacOS installer. Check [Electron Forge documentation](https://www.electronforge.io/config/makers/dmg) for usage;
- `rpm` (only available on Linux): creates a RedHat-based package. Check [Electron Forge documentation](https://www.electronforge.io/config/makers/rpm) for usage;
- `squirrel.windows` (only available on Windows and MacOS MacOS): creates a Windows installer. Check [Electron Forge documentation](https://www.electronforge.io/config/makers/squirrel.windows) for usage;
- `zip`: creates a zip package.

## Publishing Signed Bundles

As of now, only MacOS bundles can be signed before distribution.
For more details, refer to the [Release instructions](./RELEASE.md).
