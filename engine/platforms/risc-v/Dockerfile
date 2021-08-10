FROM cartesi/toolchain:latest

ENV POKER_BUILD_ENV=risc-v
ENV PATH=${PATH}:/opt/riscv/riscv64-cartesi-linux-gnu/bin

RUN apt-get update --allow-insecure-repositories && \
    apt-get install -y --allow-unauthenticated texi2html texinfo  && \
    apt-get install -y --allow-unauthenticated vim  && \
    apt-get install -y --allow-unauthenticated telnet && \
    apt-get install -y --allow-unauthenticated lzip && \
    apt-get install -y --allow-unauthenticated cmake

