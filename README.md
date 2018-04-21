# Wallets Manager

## Description
The Wallets Manager holds the data on all Stox wallets and their balances, and serves all related wallet apis.


## Setup
install global packages
```
npm install lerna rimraf cross-env env-cmd -g
```
Installs all of the packages dependencies and links any cross-dependencies
```
npm run setup
```

##Build
To build a sub-system base image, you will need an id_rsa located at the root of the repository
```
docker build -f ./docker/Dockerfile -t wallet-manager --build-arg SSH_PRIVATE_KEY="$(cat ./id_rsa)" .
```

##Run
To run a docker container for a service:
```
docker run -it -d --name <service-name> wallet-manager npm start --prefix=packages/<service-name>
```
To run service containers:
```
npm run containers
```
To monitor activemq: [Apache ActiveMQ Console](http://localhost:8161)


## Test
To run all unit test locally run

```
npm run test 
```

To run all integration tests in one container, first build the base image and then run:
```
npm run test:compose
```

## Docs
[Blockchain Writer Architecture](https://docs.google.com/document/d/1eXrxDFgjDl-2No22om8vesqGhU7iGtw8iDSuN3VoHJ4/edit#heading=h.jsy3plhn9pv8)

## Docs
[Blockchain Writer Architecture](https://docs.google.com/document/d/1eXrxDFgjDl-2No22om8vesqGhU7iGtw8iDSuN3VoHJ4/edit#heading=h.jsy3plhn9pv8)


Don't forget the api/v1 prefix. for Instance:
`http://localhost:3001/api/v1/unassigned/count`
