LIBVERSION=6.2.1
LIBNAME=gmp-$(LIBVERSION)
PREFIX=$(shell cd ..; pwd)/build
CFLAGS="-mmacosx-version-min=10.10 -Ofast" 

all: libgmp

libgmp: $(LIBNAME)
	cd gmp-$(LIBVERSION)  && \
    ./configure  \
      --host=sandybridge-apple-darwin17.7.0 \
      CFLAGS=$(CFLAGS) \
      CC=clang CXX=clang++ --prefix=$(PREFIX) && \
    make  && \
    make install

$(LIBNAME):
	wget https://gmplib.org/download/gmp/gmp-$(LIBVERSION).tar.lz  && \
    lzip -d gmp-$(LIBVERSION).tar.lz  && \
    tar -xvf gmp-$(LIBVERSION).tar && \
    rm gmp-$(LIBVERSION).tar

clean:
	rm -r gmp-$(LIBVERSION)
