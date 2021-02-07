all: libgmp

libgmp: gmp-6.2.1
	cd gmp-6.2.1  && \
    ./configure --prefix=/home/cartesi/src/cpp/build && \
    make  && \
    make install

gmp-6.2.1:
	wget https://gmplib.org/download/gmp/gmp-6.2.1.tar.lz  && \
    lzip -d gmp-6.2.1.tar.lz  && \
    tar -xvf gmp-6.2.1.tar && \
    rm gmp-6.2.1.tar

clean:
	rm -rf gmp-6.2.1