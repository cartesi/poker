# Docker package

Packaging of the poker electron app in a docker image

## Building
### Requirements
1. build the poker engine for the x64 platform
2. build the electron app

Once the requirements are built, run
```
make image
```

## Running the poker game

The electron app requires a X11 server to render its graphical user interface from inside the docker container. 
Once the X11 server installation is done, run:
``` 
make run
``` 

## X11 Server installation
### Mac
1. Install [XQuartz](https://www.xquartz.org/)
2. Open XQuartz preferences
3. Uncheck "Authenticate connections"
4. Check "Allow connections from network clients"
5. `make run`

#### Windows
1. TODO
