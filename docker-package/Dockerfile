FROM ubuntu:19.04

RUN echo '\
deb http://archive.ubuntu.com/ubuntu focal main universe multiverse restricted\n\
deb http://security.ubuntu.com/ubuntu/ focal-security main multiverse universe restricted\n\
deb http://archive.ubuntu.com/ubuntu focal-updates main multiverse universe restricted\n\
' > /etc/apt/sources.list

RUN apt-get update --allow-unauthenticated --allow-insecure-repositories
RUN apt-get install -y curl xauth xz-utils sudo x11-apps
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y  libglib2.0-dev libxshmfence-dev libnss3 libatk-adaptor libdrm-dev libgtk-3-dev libasound2-dev 

RUN useradd -ms /bin/bash poker && \
    usermod -aG sudo poker

RUN echo '\
poker     ALL=(ALL) NOPASSWD:ALL\n \
' >> /etc/sudoers

USER poker
WORKDIR /home/poker

ENV NODE_VERSION=14.17.6
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
ENV NVM_DIR=/home/poker/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/home/poker/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN npm install -g electron@13.1.9

# Add poker engine libraries
ADD engine/platforms/x64/build/lib /home/poker/lib
ENV LD_LIBRARY_PATH=/home/poker/lib

# Add electron app
# TODO: replace with electron-app
ADD docker-package/sample-app /home/poker/app

# container entry point
ADD docker-package/container-entry-point.sh .
ENTRYPOINT [ "/home/poker/container-entry-point.sh" ]
CMD [ "poker" ]