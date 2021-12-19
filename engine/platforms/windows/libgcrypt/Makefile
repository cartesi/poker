all: libgcrypt
    
LIBVERSION=1.8.0
LIBNAME=libgcrypt-$(LIBVERSION)
PREFIX=/poker/build

CFLAGS=
CXXFLAGS=

libgcrypt: $(LIBNAME)
	cd $(LIBNAME) && \
    aclocal  && \
    cp configure.ac configure.ac.original && \
    sed -e 's/m4_esyscmd(\[git rev-parse --short HEAD | tr -d \x27\\n\\r\x27\]))/m4_esyscmd(\[printf %x \$(wc -l < debian\/changelog)\]))/' configure.ac.original > configure.ac && \
    autoheader  && \
    automake && \
    autoconf && \
    ./configure  \
      CC=x86_64-w64-mingw32-gcc-win32 \
      --build=x86_64-linux-gnu \
      --host=x86_64-w64-mingw32  \
      --prefix=$(PREFIX) --with-libgpg-error-prefix=$(PREFIX)  \
      --enable-static  --disable-shared   --disable-nls  --disable-threads --disable-doc && \
    make && \
    make install

$(LIBNAME):
	wget  https://github.com/gpg/libgcrypt/archive/libgcrypt-1.8.0.zip && \
    unzip libgcrypt-$(LIBVERSION).zip && \
    mv libgcrypt-libgcrypt-$(LIBVERSION) libgcrypt-$(LIBVERSION) && \
    rm libgcrypt-$(LIBVERSION).zip

clean:
	rm -r libgcrypt-$(LIBVERSION)

