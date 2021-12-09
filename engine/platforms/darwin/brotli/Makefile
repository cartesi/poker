all: brotli

VER=1.0.9
LIBNAME=brotli-$(VER)
CWD=$(shell pwd)
PREFIX=$(shell cd ..; pwd)/build
CFLAGS="-mmacosx-version-min=10.10" 

brotli: $(LIBNAME)
	cd $(LIBNAME) && \
    ./configure-cmake CC=clang CXX=clang++  CFLAGS=$(CFLAGS) --prefix=$(PREFIX) && \
    make && \
    make install

$(LIBNAME):
	wget https://github.com/google/brotli/archive/refs/tags/v$(VER).zip && \
    unzip v$(VER).zip && \
    rm v$(VER).zip 

clean:
	rm -rf $(LIBNAME)
