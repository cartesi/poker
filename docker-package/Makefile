IMAGENAME = poker-runtime
IMAGETAG = dev
IMAGE = $(IMAGENAME):$(IMAGETAG)

RUN_CONTAINER=docker run --rm  \
         --privileged \
        -e DISPLAY=`hostname`:0 \
        -v `pwd`/../webapp:/home/poker/webapp \
        -v `pwd`/../engine:/home/poker/engine \
        -v `pwd`/sample-app:/home/poker/app \
        -u poker \
        -it $(IMAGE)

image:
	docker build --no-cache  -t $(IMAGE) -f `pwd`/Dockerfile ..

shell:
	$(RUN_CONTAINER) /bin/bash

run:
	$(RUN_CONTAINER)



