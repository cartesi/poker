SUBDIRS=platforms poker-lib
SUBSMAKE := $(addsuffix .make,$(SUBDIRS))
SUBSCLEAN := $(addsuffix .clean,$(SUBDIRS))

all: $(SUBSMAKE)

clean: $(SUBSCLEAN)

$(SUBSMAKE): %.make:
	$(MAKE) -C $*

$(SUBSCLEAN): %.clean:
	$(MAKE) -C $* clean
