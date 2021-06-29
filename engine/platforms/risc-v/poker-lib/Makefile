all: poker-lib-ext2

EXT2_PATH = /poker/build/poker-lib.ext2
EXT2_TMP_PATH = /poker/build/poker-lib-ext2-tmp

poker-lib-ext2: poker-lib
	mkdir  -p $(EXT2_TMP_PATH)/lib && \
    cp -r /poker/build/lib/* $(EXT2_TMP_PATH)/lib && \
    cp /poker/build/poker-lib/* $(EXT2_TMP_PATH) && \
    cp run.sh /poker/build/poker-lib/* $(EXT2_TMP_PATH) && \
    genext2fs -i 512 -b 176128 -d $(EXT2_TMP_PATH)  $(EXT2_PATH)

poker-lib: poker-lib-src
	cd poker-lib-src && \
    make && \
    make install

poker-lib-src:
	cp -r /poker/poker-lib-base poker-lib-src

clean:
	rm -rf poker-lib-src && \
    rm -f $(EXT2_PATH)

.PHONY: poker-lib-ext2
