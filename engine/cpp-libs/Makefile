IMGNAME=poker-build
TAG=dev

DOCKER-RUN=	docker run -p 1234:1234 --rm  -v `pwd`/src:/home/cartesi/src  \
    -e HOSTNAME=`hostname` \
    -e EMSCRIPTEN_ROOT=/home/cartesi/emsdk/upstream/emscripten \
    -e LD_LIBRARY_PATH=/home/cartesi/src/cpp/build/lib \
    -w  /home/cartesi \
    -it $(IMGNAME):$(TAG) 

all: docker-image libs

docker-image:
	docker build -t $(IMGNAME):$(TAG) .

libs:
	$(DOCKER-RUN) /bin/bash -c 'source /root/.bashrc; make -C src/cpp'

shell:
	$(DOCKER-RUN) /bin/bash

run-poker-native:
	$(DOCKER-RUN) /bin/bash -c 'source /root/.bashrc; make -C src/cpp/poker run-poker-native'

run-poker-js:
	$(DOCKER-RUN) /bin/bash -c 'source /root/.bashrc; make -C src/cpp/poker run-poker-js'

run-poker-server:
	$(DOCKER-RUN) /bin/bash -c 'source /root/.bashrc; make -C src/cpp/poker server'

clean:
	$(DOCKER-RUN) /bin/bash -c 'make -C src/cpp clean'
