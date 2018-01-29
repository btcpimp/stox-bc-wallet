--DROP TABLE "tokensTransfersReads";
--DROP TABLE "tokensTransfers";
--DROP TABLE "tokensBalances";
--DROP TABLE "wallets";
--DROP TABLE "tokens";

--tokens
CREATE TABLE "tokens"
(
    "id" CHARACTER VARYING(255) PRIMARY KEY,
    "name" CHARACTER VARYING(255) NOT NULL,
    "address" CHARACTER(42) NOT NULL,
    "network" CHARACTER VARYING(255) NOT NULL,
    "createdAt" timestamp with time zone default CURRENT_DATE NOT NULL
);

CREATE INDEX tokens_updated_at ON "tokens" USING btree ("createdAt");

--wallets
CREATE TABLE "wallets"
(
    "id" CHARACTER VARYING(255) PRIMARY KEY,
    "address" CHARACTER(42) NOT NULL,
    "network" CHARACTER VARYING(255) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE NOT NULL,
    "assignedAt" TIMESTAMP WITH TIME ZONE,
    "setWithdrawAddressAt" TIMESTAMP WITH TIME ZONE,
    "corruptedAt" TIMESTAMP WITH TIME ZONE,
    "version" SMALLINT DEFAULT 0 NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE NOT NULL
);

CREATE INDEX wallets_created_at ON "wallets" USING btree ("createdAt");
CREATE INDEX wallets_assigned_at ON "wallets" USING btree ("assignedAt");
CREATE INDEX wallets_setwithdrawaddress_at ON "wallets" USING btree ("setWithdrawAddressAt");
CREATE INDEX wallets_corrupted_at ON "wallets" USING btree ("corruptedAt");
CREATE INDEX wallets_updated_at ON "wallets" USING btree ("updatedAt");

--tokensBalances
CREATE TABLE "tokensBalances"
(
    "walletId" CHARACTER VARYING(255),
    "tokenId" CHARACTER VARYING(255) NOT NULL,
    "balance" numeric(38,18) DEFAULT 0 NOT NULL,
    "pendingUpdateBalance" INTEGER DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_DATE NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT tokensBalances_pk PRIMARY KEY ("walletId", "tokenId"),
    CONSTRAINT tokensBalances_walletId_fk FOREIGN KEY ("walletId")
        REFERENCES "wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT tokensBalances_tokenId_fk FOREIGN KEY ("tokenId")
        REFERENCES "tokens" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX tokensBalances_balance ON "tokensBalances" USING btree ("balance");
CREATE INDEX tokensBalances_created_at ON "tokensBalances" USING btree ("createdAt");
CREATE INDEX tokensBalances_updated_at ON "tokensBalances" USING btree ("updatedAt");

--transactions
CREATE TABLE "tokensTransfers"
(
    "blockNumber" BIGINT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "transactionHash" CHARACTER(66) NOT NULL,
    "tokenId" CHARACTER VARYING(255) NOT NULL,
    "network" CHARACTER VARYING(255) NOT NULL,
    "fromAddress" CHARACTER(42) NOT NULL,
    "toAddress" CHARACTER(42) NOT NULL,
    "amount" NUMERIC(38, 18),
    "currentBlockTime" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT CURRENT_DATE NOT NULL,
    "rawData" json,
    CONSTRAINT tokensTransfers_pk PRIMARY KEY ("blockNumber", "logIndex"),
    CONSTRAINT tokensTransfers_tokenId_fk FOREIGN KEY ("tokenId")
        REFERENCES "tokens" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX tokensTransfers_created_at ON "tokensTransfers" USING btree ("createdAt");

--tokensTransfersReads
CREATE TABLE "tokensTransfersReads"
(
    "tokenId" CHARACTER VARYING(255) PRIMARY KEY,
    "lastReadBlockNumber" bigint NOT NULL,
    "updatedAt" timestamp with time zone default CURRENT_DATE NOT NULL,
    CONSTRAINT tokensTransfersReads_tokenId_fk FOREIGN KEY ("tokenId")
        REFERENCES "tokens" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX tokensTransfersReads_updated_at ON "tokensTransfersReads" USING btree ("updatedAt");

--INSERT INTO "tokens" ("id", "name", "address", "network") VALUES ('MAIN.0x006bea43baa3f7a6f765f14f10a1a1b08334ef45', 'STX', '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45', 'MAIN');
--INSERT INTO "wallets" ("id", "address", "network") VALUES ('MAIN.0xF87a7EC94884F44D9dE33d36b73F42c7c0Dd38B1', '0xF87a7EC94884F44D9dE33d36b73F42c7c0Dd38B1', 'MAIN');
--INSERT INTO "wallets" ("id", "address", "network") VALUES ('MAIN.0xb1C5FaEEc6AD4Ff9FeeD18ad76A459aAf7344D7C', '0xb1C5FaEEc6AD4Ff9FeeD18ad76A459aAf7344D7C', 'MAIN');
--INSERT INTO "wallets" ("id", "address", "network") VALUES ('MAIN.0x972bc28f0618084ebbd8093b49ea1ea0c2d2af45', '0x972bc28f0618084ebbd8093b49ea1ea0c2d2af45', 'MAIN');
--INSERT INTO "wallets" ("id", "address", "network") VALUES ('MAIN.0x1db40ef4a9f71a3c207f99a7a0b5efd6d44dba54', '0x1db40ef4a9f71a3c207f99a7a0b5efd6d44dba54', 'MAIN');
--INSERT INTO "wallets" ("id", "address", "network") VALUES ('MAIN.0x9c0a1f6f5453841f889234915ffba500843f6c38', '0x9c0a1f6f5453841f889234915ffba500843f6c38', 'MAIN');
--INSERT INTO "wallets" ("id", "address", "network") VALUES ('MAIN.0xf85bf5db8c666b387fe3652511558ebd07f86992', '0xf85bf5db8c666b387fe3652511558ebd07f86992', 'MAIN');
--INSERT INTO "wallets" ("id", "address", "network") VALUES ('MAIN.0x797d713d8d7a2815ccf3dcf9719e3e9f1712c370', '0x797d713d8d7a2815ccf3dcf9719e3e9f1712c370', 'MAIN');
--INSERT INTO "tokensTransfersReads" ("tokenId", "lastReadBlockNumber") VALUES ('MAIN.0x006bea43baa3f7a6f765f14f10a1a1b08334ef45', 0);