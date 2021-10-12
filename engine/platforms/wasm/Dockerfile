FROM gcc:latest

ENV POKER_BUILD_ENV=wasm
ENV PATH=${PATH}:/poker/emsdk/node/14.15.5_64bit/bin
ENV POKER_LOGGING=0

RUN apt-get update --allow-insecure-repositories && \
    apt-get install -y --allow-unauthenticated texi2html texinfo  && \
    apt-get install -y --allow-unauthenticated vim  && \
    apt-get install -y --allow-unauthenticated telnet && \
    apt-get install -y --allow-unauthenticated gettext && \
    apt-get install -y --allow-unauthenticated lzip && \
    apt-get install -y --allow-unauthenticated cmake

RUN mkdir /poker && \
    cd /poker  && \
    wget --output-document=emsdk.zip https://codeload.github.com/emscripten-core/emsdk/zip/master  && \
    unzip emsdk.zip && \
    rm emsdk.zip && \
    mv emsdk-master emsdk  && \
    cd emsdk  && \
    ./emsdk install latest  && \
    ./emsdk activate latest && \
    echo "source /poker/emsdk/emsdk_env.sh" >> /root/.bashrc


RUN npm install --global yarn
