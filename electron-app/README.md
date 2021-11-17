# Poker Electron App

Desktop version of the [Texas HODL'em Poker](../README.md).
It's basically a port of the [webapp](../webapp/README.md) version to the [Electron](https://www.electronjs.org/) framework.

It also depends on the `Descartes Environment` being properly set up as defined in the [project documentation](../README.md#Environment).

## Deploying and Running

The process is quite similar to [the one available in the webapp](../webapp/README.md#deploying-and-running) version of the application.

The basic difference is that the application will run from [http://localhost:3000](http://localhost:3000) and be opened by a Chromium instance under Electron.
Do not use a web browser to navigate the application.

Deployment logs are also accessible at [http://localhost:9000](http://localhost:9000).

### Mock mode

The _mock_ mode works [the same way as in the webapp](../webapp/README.md#deploying-and-running).
You may start it by running:

```bash
$ yarn dev:mock
```

## Packaging the Application

Electron allows for the generation of application binaries via electron-packager.
We have used Electron Forge scaffolding features to [perfom that](https://www.electronforge.io/cli#package).

In order to package the application, simply run:

```shell
$ yarn package
```

The application contents are going to be available under directory `out/`.
The actual tree will depend on the platform being used.

For example, for MacOS, the application executable will be generated at `out/cartesi-poker-darwin-x64/cartesi-poker.app/Contents/MacOS/cartesi-poker`.

Also, the application assets, etc., will be available under `out/cartesi-poker-darwin-x64/cartesi-poker.app/Contents/Resources/app/`, which should have the following structure:

```shell
.
├── .webpack
├── node_modules
└── package.json
```

In order to run the packaged app, simply run the executable.
For MacOS, do as follows:

```shell
$ ./out/cartesi-poker-darwin-x64/cartesi-poker.app/Contents/MacOS/cartesi-poker
```

### Mock mode

The mock mode may also be activated via the executable.
In order to activate simply run the binary passing the argument `mock`, as follows:

```shell
$ ./out/cartesi-poker-darwin-x64/cartesi-poker.app/Contents/MacOS/cartesi-poker mock
```

## Making Distributables

We also use Electron Forge to [make distributables](https://www.electronforge.io/cli#make) for the application.

In order to make distributables, just run:

```shell
$ yarn make
```

The resulting files should be available under directory `out/make/`.
The actual file names will depend on the platform being used to build the application and the target format.

For example, on a MacOS, a file for the default target (zip) should be available at `out/make/zip/darwin/x64/cartesi-poker-darwin-x64-1.0.0.zip`.
