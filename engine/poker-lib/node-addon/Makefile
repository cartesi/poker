BUILD_DEST ?= /poker/build/lib
ADDON = build/Release/pokerlib.node

all: $(ADDON)

$(ADDON):
	yarn && yarn build
  
test: $(ADDON)
	yarn test
