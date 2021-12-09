SRC_BASE=`pwd`/../../../poker-lib

all: poker-lib

poker-lib: poker-lib-src
	make -C poker-lib-src && \
  make -C poker-lib-src install

test: poker-lib
	make -C poker-lib-src test
    
poker-lib-src:
	cp -r $(SRC_BASE) poker-lib-src

clean:
	rm -r poker-lib-src

