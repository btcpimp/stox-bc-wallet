
CREATE TABLE "networks"
(
    "id" SERIAL PRIMARY KEY,
    "name" character(42) NOT NULL,
    CONSTRAINT networks_name_key UNIQUE ("name")
)

CREATE TABLE "tokens"
(
    "id" SERIAL PRIMARY KEY,
    "name" character(42) NOT NULL,
    "address" character(42) NOT NULL  -- TODO: is it the same address in all networks ?
)

CREATE TABLE "wallets"
(
    "id" SERIAL PRIMARY KEY,
    "networkId" integer,
    "address" character(42) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "assignedAt" timestamp with time zone,
    CONSTRAINT wallets_networkid_fk FOREIGN KEY ("networkId")
        REFERENCES "networks" ("id") MATCH SIMPLE
)

CREATE TABLE "walletBalance"
(
    "walletId" integer,
    "tokenId" integer,
    "balance" numeric(38,18) NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT walletbalance_walletid_fk FOREIGN KEY ("walletId")
        REFERENCES "wallets" (id) MATCH SIMPLE,
    CONSTRAINT walletBalance_tokenid_fk FOREIGN KEY ("tokenId")
        REFERENCES "tokens" (id) MATCH SIMPLE
)

CREATE TABLE "transactionLog"
(
    "id" SERIAL PRIMARY KEY,
    "networkId" integer,
    "transactionHash" character(66) NOT NULL,
    "address" character(42) NOT NULL,
    "blockNumber" bigint NOT NULL,
    "from" character(42) NOT NULL,
    "to" character(42) NOT NULL,
    "amount" numeric(38, 18),
    "rawData" json,
    CONSTRAINT transactionLog_networkid_fk FOREIGN KEY ("networkId")
        REFERENCES "networks" ("id") MATCH SIMPLE
)

CREATE TABLE "transactionLogManagment"
(
    "tokenId" integer NOT NULL,
    "networkId" integer,
    "lastReadBlock" bigint NOT NULL,
    CONSTRAINT transactionlogmanagment_tokenid_fk FOREIGN KEY ("tokenId")
        REFERENCES "tokens" ("id") MATCH SIMPLE,
    CONSTRAINT transactionlogmanagment_networkid_fk FOREIGN KEY ("networkId")
        REFERENCES "networks" ("id") MATCH SIMPLE
)

CREATE INDEX wallets_assigned_at ON "wallets" USING btree ("assignedAt")
CREATE INDEX wallets_created_at ON "wallets" USING btree ("createdAt");
CREATE INDEX walletBalance_balance ON "walletBalance" USING btree (balance);
CREATE INDEX walletBalance_updated_at ON "walletBalance" USING btree ("updatedAt");

INSERT INTO "networks" ("name") VALUES ('main');
INSERT INTO "networks" ("name") VALUES ('morden');

INSERT INTO "tokens" ("name", "address") VALUES ('STX', '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45');
INSERT INTO "tokens" ("name", "address") VALUES ('EOS', '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45');

INSERT INTO "transactionLogManagment" ("tokenId", "networkId", "lastReadBlock") VALUES (1, 1, 0); --STX in main network
INSERT INTO "transactionLogManagment" ("tokenId", "networkId", "lastReadBlock") VALUES (1, 2, 0); --STX in testnet
INSERT INTO "transactionLogManagment" ("tokenId", "networkId", "lastReadBlock") VALUES (2, 2, 0); --EOS in testnet

CREATE INDEX wallets_assigned_at ON "wallets" USING btree ("assignedAt")