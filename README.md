create postgress container
--------------------------

`$ docker run --name stox-bc-wallet-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=stoxbcwallet -d -p 5433:5432 postgres`

