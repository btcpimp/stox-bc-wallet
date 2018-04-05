# Wallets Manager

## Description
The Wallets Manager holds the data on all Stox wallets and their balances, and serves all related wallet apis.


## Getting Started

```npm run setup```

Installs all of the packages dependencies and links any cross-dependencies.

```npm run setup:clean```

Remove the node_modules directory from all packages and run setup

```$ npm run lint```

run lint for all packages

`$ ./common.sh link`

link stox-common package to all services

## Containers

### Postgress
```
docker build -f db.Dockerfile -t stox-bc-wallet-postgres .
docker run --name stox-bc-wallet-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=stoxbcwallet -d -p 5433:5432 stox-bc-wallet-postgres
```

### Active MQ
```
$ docker run -p 61613:61613 -p 8161:8161 -d --name="activemq" rmohr/activemq
```
[Apache ActiveMQ Console](http://localhost:8161)

## Docs
[Blockchain Writer Architecture](https://docs.google.com/document/d/1eXrxDFgjDl-2No22om8vesqGhU7iGtw8iDSuN3VoHJ4/edit#heading=h.jsy3plhn9pv8)


Don't forget the api/v1 prefix. for Instance:
`http://localhost:3001/api/v1/unassigned/count`
