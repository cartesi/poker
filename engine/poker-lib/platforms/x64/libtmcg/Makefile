VER=1.3.18
LIBNAME=libTMCG-$(VER)

all: libtmcg

libtmcg: $(LIBNAME)
	cd $(LIBNAME)  && \
    git apply /poker/patches/$(LIBNAME).patch && \
    aclocal  -I /poker/build/share/aclocal && \
    libtoolize   --force && \
    autoheader  && \
    automake  --force-missing --add-missing && \
    autoconf && \
    ./configure --prefix=/poker/build --with-libgpg-error-prefix=/poker/build --with-libgcrypt-prefix=/poker/build   && \
    make && \
    make install

$(LIBNAME):
	wget  https://github.com/HeikoStamer/libtmcg/archive/release-$(LIBNAME).zip && \
    unzip release-libTMCG-$(VER).zip && \
    mv libtmcg-release-libTMCG-$(VER) $(LIBNAME) && \
    rm release-libTMCG-$(VER).zip && \
    cd $(LIBNAME)

clean:
	rm -rf $(LIBNAME)
