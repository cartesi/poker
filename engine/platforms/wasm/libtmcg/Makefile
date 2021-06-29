VER=1.3.18
LIBNAME=libTMCG-$(VER)

libtmcg: $(LIBNAME)
	cd $(LIBNAME)  && \
    git apply /poker/patches/$(LIBNAME).patch && \
	aclocal  -I /poker/build/share/aclocal && \
    libtoolize   --force   && \
    autoheader    && \
    automake  --force-missing --add-missing   && \
    autoconf  && \
    emconfigure ./configure \
        --disable-doc --disable-tests \
        --prefix=/poker/build \
        CXXFLAGS="-s DISABLE_EXCEPTION_CATCHING=0" \
        --with-gmp=/poker/build \
        --with-libgpg-error-prefix=/poker/build \
        --with-libgcrypt-prefix=/poker/build && \
    cp Makefile Makefile.original  && \
    sed -e 's:doc tests::' Makefile.original > Makefile  && \
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
