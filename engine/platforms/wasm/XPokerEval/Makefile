VER=master
LIBNAME=XPokerEval-$(VER)

XPokerEval: $(LIBNAME)
	cd $(LIBNAME)/XPokerEval/XPokerEval.Pokersource  && \
	autoreconf --force --install && \
    emconfigure ./configure \
        --prefix=/poker/build \
        --disable-libtool-lock  && \
    cp Makefile Makefile.original  && \
    sed -e 's:examples/Makefile.dos::; s:examples::' Makefile.original > Makefile  && \
    cd lib && \
    cp Makefile Makefile.original  && \
    sed -e 's:\./mktab_basic:echo \./mktab_basic:; s:\./mktab_joker:echo \./mktab_joker:; s:\./mktab_packed:echo \./mktab_packed:; s:\./mktab_evx:echo \./mktab_evx:; s:\./mktab_astud:echo \./mktab_astud:; s:\./mktab_lowball:echo \./mktab_lowball:; s:\./evx_gen5:echo \./evx_gen5:; s:\./evx_gen7: echo \./evx_gen7:' Makefile.original > Makefile  && \
    cd .. && \
    make && \
    make install

$(LIBNAME):
	wget   https://github.com/christophschmalhofer/poker/archive/refs/heads/master.zip && \
    unzip master.zip && \
    rm master.zip && \
    mv poker-master $(LIBNAME)
 
clean:
	rm -rf $(LIBNAME)
