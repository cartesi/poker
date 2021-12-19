FROM gcc:10.2.0

ENV POKER_BUILD_ENV=windows
ENV LD_LIBRARY_PATH=/poker/build/lib
ENV POKER_LOGGING=0
ENV PATH="/root/.nvm/versions/node/v14.17.6/bin:${PATH}"


RUN apt-get update --allow-insecure-repositories && \
    apt-get install -y --allow-unauthenticated texi2html texinfo  && \
    apt-get install -y --allow-unauthenticated vim  && \
    apt-get install -y --allow-unauthenticated telnet && \
    apt-get install -y --allow-unauthenticated lzip && \
    apt-get install -y --allow-unauthenticated cmake && \
    apt-get install -y --allow-unauthenticated gettext && \
    apt-get install -y --allow-unauthenticated g++-mingw-w64 && \
    apt-get install --only-upgrade -y --allow-unauthenticated gcc-mingw-w64

RUN cd ~ && \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash && \
    . ~/.bashrc  && \
    nvm install 14.17.6 && \
    nvm use 14.17.6 && \
    node --version && \
    npm install -g yarn
