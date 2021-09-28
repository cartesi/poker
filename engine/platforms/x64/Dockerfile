FROM gcc:latest

ENV LD_LIBRARY_PATH=/poker/build/lib
ENV POKER_LOGGING=0

RUN apt-get update --allow-insecure-repositories && \
    apt-get install -y --allow-unauthenticated texi2html texinfo  && \
    apt-get install -y --allow-unauthenticated vim  && \
    apt-get install -y --allow-unauthenticated telnet && \
    apt-get install -y --allow-unauthenticated lzip && \
    apt-get install -y --allow-unauthenticated cmake
