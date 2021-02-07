PREFIX=/home/cartesi/src/cpp/build-wasm
VER=1.3.18
LIBNAME=libTMCG-$(VER)

libtmcg: $(LIBNAME)
	cd $(LIBNAME)  && \
	aclocal  -I /home/cartesi/src/cpp/build-wasm/share/aclocal && \
    libtoolize   --force   && \
    autoheader    && \
    automake  --force-missing --add-missing   && \
    autoconf  && \
    emconfigure ./configure \
        --disable-doc --disable-tests \
        --prefix=/home/cartesi/src/cpp/build-wasm \
        CXXFLAGS="-s DISABLE_EXCEPTION_CATCHING=0" \
        --with-gmp=/home/cartesi/src/cpp/build-wasm \
        --with-libgpg-error-prefix=/home/cartesi/src/cpp/build-wasm \
        --with-libgcrypt-prefix=/home/cartesi/src/cpp/build-wasm && \
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
