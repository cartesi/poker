LIBVERSION=1.27
LIBNAME=libgpg-error-$(LIBVERSION)
PREFIX=$(shell cd ..; pwd)/build
CFLAGS="-mmacosx-version-min=10.10" 

all: libgpg-error

libgpg-error: $(LIBNAME)
	cd $(LIBNAME)  && \
    ./configure CC=clang CXX=clang++ CFLAGS=$(CFLAGS) --prefix=$(PREFIX) \
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
