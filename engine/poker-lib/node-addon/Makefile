UNAME = $(shell uname -s)
ADDON = build/Release/pokerlib.node

ifeq ($(UNAME),Darwin)
  CXXFLAGS = '-mmacosx-version-min=10.10'  
endif

all: $(ADDON)

$(ADDON):
	yarn && \
  CXXFLAGS=$(CXXFLAGS) yarn build
  
test: $(ADDON)
	yarn test
