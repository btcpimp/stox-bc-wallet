create postgress container
--------------------------

`$ docker run --name stox-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=stox2 -d -p 5432:5432 postgres`

