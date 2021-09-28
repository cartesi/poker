VER=master
LIBNAME=poker-eval-$(VER)
BUILD-ARCH=x86_64-pc-linux-gnu  
HOST-ARCH=riscv64-cartesi-linux-gnu


poker-eval: $(LIBNAME)
	cd $(LIBNAME) && \
	autoreconf --force --install && \
    ./configure \
        --build=$(BUILD-ARCH)  --host=$(HOST-ARCH) \
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
