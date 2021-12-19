LIBVERSION=1.27
LIBNAME=libgpg-error-$(LIBVERSION)
PREFIX=/poker/build
CFLAGS=

all: libgpg-error

libgpg-error: $(LIBNAME)
	cd $(LIBNAME)  && \
    ./configure  \
      CC=x86_64-w64-mingw32-gcc-win32 \
      --build=x86_64-linux-gnu \
      --host=x86_64-w64-mingw32  \
      --disable-shared --enable-static \
      --prefix=$(PREFIX)  \
      --disable-nls && \
    make && \
    make install

$(LIBNAME):
	wget https://gnupg.org/ftp/gcrypt/libgpg-error/libgpg-error-$(LIBVERSION).tar.bz2 && \
    bunzip2 libgpg-error-$(LIBVERSION).tar.bz2 && \
    tar xvf libgpg-error-$(LIBVERSION).tar && \
    rm libgpg-error-$(LIBVERSION).tar

clean:
	rm -r libgpg-error-$(LIBVERSION)
