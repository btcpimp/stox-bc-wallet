--DROP TABLE "eventLogs";
--DROP TABLE "eventLogsSettings";
--DROP TABLE "tokens";
--DROP TABLE "wallets";

CREATE TABLE "eventLogs"
(
    "transactionHash" character(66) NOT NULL,
    "tokenAddress" character(42) NOT NULL,
    "blockNumber" bigint NOT NULL,
    "from" character(42),
    "to" character(42),
    "amount" numeric(38,18),
    CONSTRAINT "eventLogs_pkey" PRIMARY KEY ("transactionHash")
)

CREATE TABLE "eventLogsSettings"
(
    "tokenAddress" character(42) NOT NULL,
    "lastReadBlock" integer DEFAULT 0,
    CONSTRAINT "eventLogsSettings_pkey" PRIMARY KEY ("tokenAddress")
)

CREATE TABLE "tokens"
(
    "address" character(42) NOT NULL,
    "name" character(42) NOT NULL,
    CONSTRAINT tokens_pkey PRIMARY KEY ("address")
)

CREATE TABLE "wallets"
(
    "address" character(42) NOT NULL,
    "tokenAddress" character(42),
    "balance" numeric(38,18),
    "createdAt" date,
    "assignedAt" date,
    CONSTRAINT wallets_pkey PRIMARY KEY ("address")
)