all: libgcrypt
    
LIBVERSION=1.8.0
LIBNAME=libgcrypt-$(LIBVERSION)
    

libgcrypt: $(LIBNAME)
	cd $(LIBNAME) && \
    aclocal  && \
    libtoolize  && \
    autoheader  && \
    automake && \
    autoconf && \
    ./configure --prefix=/poker/build --with-libgpg-error-prefix=/poker/build  --enable-shared  --disable-static   --disable-nls  --disable-threads --disable-doc   && \
    make && \
    make install

$(LIBNAME):
	wget  https://github.com/gpg/libgcrypt/archive/libgcrypt-1.8.0.zip && \
    unzip libgcrypt-$(LIBVERSION).zip && \
    mv libgcrypt-libgcrypt-$(LIBVERSION) libgcrypt-$(LIBVERSION) && \
    rm libgcrypt-$(LIBVERSION).zip

clean:
	rm -r libgcrypt-$(LIBVERSION)
