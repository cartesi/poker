ADDON = build/Release/pokerlib.node

all: $(ADDON)

$(ADDON):
	yarn && yarn build
  
test: $(ADDON)
	yarn test
