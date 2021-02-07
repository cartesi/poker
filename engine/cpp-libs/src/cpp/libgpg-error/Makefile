all: libgpg-error

libgpg-error: libgpg-error-1.27
	cd libgpg-error-1.27  && \
    ./configure --prefix=/home/cartesi/src/cpp/build && \
    make && \
    make install

libgpg-error-1.27:
	wget https://gnupg.org/ftp/gcrypt/libgpg-error/libgpg-error-1.27.tar.bz2 && \
    bunzip2 libgpg-error-1.27.tar.bz2 && \
    tar xvf libgpg-error-1.27.tar && \
    rm libgpg-error-1.27.tar

clean:
	rm -rf libgpg-error-1.27