all: build

build:
	yarn && yarn build && cp src/lib/*.ts /poker/build/poker-lib

test: build
	yarn test
