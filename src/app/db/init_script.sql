--DROP TABLE "eventLogs";
--DROP TABLE "eventLogsSettings";
--DROP TABLE "tokens";
--DROP TABLE "wallets";
--DROP TABLE "walletBalance";

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
    "createdAt" timestamp with time zone NOT NULL,
    "assignedAt" timestamp with time zone,
    CONSTRAINT wallets_pkey PRIMARY KEY ("address")
)

CREATE TABLE "walletBalance"
(
    "address" character(42) NOT NULL,
    "tokenAddress" character(42) NOT NULL,
    "balance" numeric(38,18) NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "walletBalance_pkey" PRIMARY KEY ("address", "tokenAddress")
)

CREATE INDEX wallets_assigned_at ON wallets USING btree ("assignedAt")