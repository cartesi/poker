FROM node:14-alpine

RUN apk add --no-cache git

ENV BASE /opt/cartesi

WORKDIR $BASE/share/blockchain
COPY yarn.lock .
COPY package.json .
COPY hardhat.config.ts .

RUN yarn 

EXPOSE 8545  

CMD ["npx", "hardhat",  "node" ]
