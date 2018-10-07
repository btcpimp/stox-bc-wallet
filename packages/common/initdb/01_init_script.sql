--DROP TABLE "tokensTransfersReads";
--DROP TABLE "tokensTransfers";
--DROP TABLE "tokensBalances";
--DROP TABLE "wallets";
--DROP TABLE "tokens";
--DROP TABLE "pendingRequests";

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

CREATE TABLE "pendingRequests"
(
    type CHARACTER VARYING(30) PRIMARY KEY,
    count INTEGER NOT NULL,
    "updatedAt" timestamp with time zone default CURRENT_DATE NOT NULL
);

INSERT INTO "tokens" ("id", "name", "address", "network") VALUES ('MAIN.0x006bea43baa3f7a6f765f14f10a1a1b08334ef45', 'STX', '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45', 'MAIN');
