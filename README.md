# Wallets Manager

## Description

The Wallets Manager holds the data on all Stox wallets and their balances, and serves all related wallet apis.

## Services
**wallets-abi**

Returns the bytecode needed to perform a specific wallet transaction.Stox wallets currently support the following APIs

**wallets-api**

Service for wallet related apis (getBalance, createWallet)...

**wallets-issuing**

A service that monitor the number of unassigned wallets inside the wallets db. If this number gets too low (under a yet-to-be-defined threshold), it will issue new wallet creation requests to the Request Manager’s Incoming Requests queue.

**Wallets Issuance Monitor**

A service that monitor the completed requests queue, and checks for completed Wallet Issuance requests. If it finds a successful completed request, it adds the newly created wallet address to the wallets db.


## Docker containers
**Postgress database**

`$ docker run --name stox-bc-wallet-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=stoxbcwallet -d -p 5433:5432 postgres`

**Active MQ**

`$ docker run -p 61613:61613 -p 8161:8161 -d --name="activemq" rmohr/activemq`

## install

`$ npm run setup`

run npm install in all packages

`$ npm run setup:clean`

delete node_modules and package_lock.json before installing
