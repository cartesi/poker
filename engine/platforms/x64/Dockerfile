FROM gcc:10.2.0

ENV POKER_BUILD_ENV=x64
ENV LD_LIBRARY_PATH=/poker/build/lib
ENV POKER_LOGGING=0
ENV PATH="/root/.nvm/versions/node/v14.17.6/bin:${PATH}"


RUN apt-get update --allow-insecure-repositories && \
    apt-get install -y --allow-unauthenticated texi2html texinfo  && \
    apt-get install -y --allow-unauthenticated vim  && \
    apt-get install -y --allow-unauthenticated telnet && \
    apt-get install -y --allow-unauthenticated lzip && \
    apt-get install -y --allow-unauthenticated cmake patchelf

RUN cd ~ && \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash && \
    . ~/.bashrc  && \
    nvm install 14.17.6 && \
    nvm use 14.17.6 && \
    node --version && \
    npm install -g yarn
