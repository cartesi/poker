FROM gcc:latest

RUN apt-get update --allow-insecure-repositories && \
    apt-get install -y --allow-unauthenticated texi2html texinfo  && \
    apt-get install -y --allow-unauthenticated vim  && \
    apt-get install -y --allow-unauthenticated telnet && \
    apt-get install -y --allow-unauthenticated lzip

RUN mkdir /home/cartesi && \
    cd /home/cartesi  && \
    wget --output-document=emsdk.zip https://codeload.github.com/emscripten-core/emsdk/zip/master  && \
    unzip emsdk.zip && \
    rm emsdk.zip && \
    mv emsdk-master emsdk  && \
    cd emsdk  && \
    ./emsdk install latest  && \
    ./emsdk activate latest && \
    echo "source /home/cartesi/emsdk/emsdk_env.sh" >> /root/.bashrc
