LIBVERSION=6.2.1
LIBNAME=gmp-$(LIBVERSION)
PREFIX=/poker/build
CFLAGS=

all: libgmp

libgmp: $(LIBNAME)
	cd gmp-$(LIBVERSION)  && \
    ./configure  \
      CC=x86_64-w64-mingw32-gcc-win32  --prefix=$(PREFIX) \
      --enable-fat \
      --disable-shared \
      --enable-static \
      --build=x86_64-linux-gnu \
      --host=x86_64-w64-mingw32 && \
    make  && \
    make install

$(LIBNAME):
	wget https://gmplib.org/download/gmp/gmp-$(LIBVERSION).tar.lz  && \
    lzip -d gmp-$(LIBVERSION).tar.lz  && \
    tar -xvf gmp-$(LIBVERSION).tar && \
    rm gmp-$(LIBVERSION).tar

clean:
	rm -r gmp-$(LIBVERSION)
