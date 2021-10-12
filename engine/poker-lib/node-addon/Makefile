BUILD_DEST ?= /poker/build/lib
ADDON = build/Release/pokerlib.node

all: $(ADDON)

$(ADDON): node_modules poker-lib-addon.cpp
	npm run build && \
  cp $(ADDON) $(BUILD_DEST)

node_modules:
	npm install
  
test: $(ADDON)
	npm test
