VER=master
LIBNAME=poker-eval-$(VER)
BUILD-ARCH=x86_64-linux-gnu
HOST-ARCH=x86_64-w64-mingw32

poker-eval: $(LIBNAME)
	cd $(LIBNAME) && \
  cp lib/Makefile.am lib/Makefile.am.original && \
  sed -e 's:evx_gen5 evx_gen7 evx_preamble.cfrag:evx_gen5.exe evx_gen7.exe evx_preamble.cfrag:' lib/Makefile.am.original > lib/Makefile.am && \
	autoreconf --force --install && \
    ./configure \
        --build=$(BUILD-ARCH)  \
        --host=$(HOST-ARCH) \
        --prefix=/poker/build && \
    cp Makefile Makefile.original  && \
    sed -e 's:examples/Makefile.dos::; s:examples::' Makefile.original > Makefile  && \
    cd lib && \
    cp Makefile Makefile.original  && \
    sed -e 's:\./mktab_basic:echo \./mktab_basic:; s:\./mktab_joker:echo \./mktab_joker:; s:\./mktab_packed:echo \./mktab_packed:; s:\./mktab_evx:echo \./mktab_evx:; s:\./mktab_astud:echo \./mktab_astud:; s:\./mktab_lowball:echo \./mktab_lowball:; s:\./evx_gen5:echo \./evx_gen5:; s:\./evx_gen7: echo \./evx_gen7:' Makefile.original > Makefile  && \
    cd .. && \
    make && \
    make install

$(LIBNAME):
	wget   https://github.com/cartesi-corp/poker-eval/archive/refs/heads/master.zip && \
    unzip master.zip && \
    rm master.zip

clean:
	rm -r $(LIBNAME)

