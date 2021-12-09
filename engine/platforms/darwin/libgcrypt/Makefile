all: libgcrypt
    
LIBVERSION=1.8.0
LIBNAME=libgcrypt-$(LIBVERSION)
PREFIX=$(shell cd ..; pwd)/build    

CFLAGS="-mmacosx-version-min=10.10  -Ofast"  
CXXFLAGS="-mmacosx-version-min=10.10  -Ofast"

libgcrypt: $(LIBNAME)
	cd $(LIBNAME) && \
    aclocal  && \
    autoheader  && \
    automake && \
    autoconf && \
    ./configure CC=clang CXX=clang++ CFLAGS=$(CFLAGS) CXXFLAGS=$(CXXFLAGS) \
      --prefix=$(PREFIX) --with-libgpg-error-prefix=$(PREFIX)  \
      --enable-shared  --disable-static   --disable-nls  --disable-threads --disable-doc && \
    make && \
    make install

$(LIBNAME):
	wget  https://github.com/gpg/libgcrypt/archive/libgcrypt-1.8.0.zip && \
    unzip libgcrypt-$(LIBVERSION).zip && \
    mv libgcrypt-libgcrypt-$(LIBVERSION) libgcrypt-$(LIBVERSION) && \
    rm libgcrypt-$(LIBVERSION).zip

clean:
	rm -r libgcrypt-$(LIBVERSION)

