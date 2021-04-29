VER=1.3.18
LIBNAME=libTMCG-$(VER)
BUILD-ARCH=x86_64-pc-linux-gnu  
HOST-ARCH=riscv64-cartesi-linux-gnu

libtmcg: $(LIBNAME)
	cd $(LIBNAME)  && \
    git apply /poker/patches/$(LIBNAME).patch && \
	aclocal  -I /poker/build/share/aclocal && \
    libtoolize   --force   && \
    cp configure.ac configure.ac.original && \
    sed -e 's:signal.h::; s:AC_FUNC_MALLOC::' configure.ac.original > configure.ac && \
    cp src/libTMCG.hh src/libTMCG.hh.original  && \
    sed -e 's:#define TMCG_MAX_PLAYERS 32:#define TMCG_MAX_PLAYERS 3:; s:#define TMCG_MAX_CARDS 512:#define TMCG_MAX_CARDS 52:; s:#define TMCG_MAX_TYPEBITS 10:#define TMCG_MAX_TYPEBITS 6:' src/libTMCG.hh.original  > src/libTMCG.hh && \
    autoheader    && \
    automake  --force-missing --add-missing   && \
    autoconf  && \
    ./configure  --prefix=/poker/build \
        --build=$(BUILD-ARCH)  --host=$(HOST-ARCH)  \
        --disable-doc --disable-tests  \
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
