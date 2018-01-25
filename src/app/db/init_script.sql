--tokens
CREATE TABLE "tokens"
(
    "id" CHARACTER VARYING(255),
    "name" CHARACTER VARYING(255) NOT NULL,
    "address" CHARACTER(42) NOT NULL,
    "network" CHARACTER VARYING(255) NOT NULL,
    "createdAt" timestamp with time zone default CURRENT_DATE NOT NULL,
    CONSTRAINT tokens_id_pk PRIMARY KEY ("id")
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
    "version" SMALLINT NOT NULL,
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
    "tokenId" CHARACTER(42) NOT NULL,
    "balance" numeric(38,18) NOT NULL,
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


--inserts
INSERT INTO "tokens" ("id", "name", "address", "network") VALUES ('MAIN.STX', 'STX', '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45', 'MAIN');
-- INSERT INTO "tokens" ("id", "name", "address", "network") VALUES ('MAIN.EOS', 'EOS', '0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0', 'MAIN');
-- INSERT INTO "tokens" ("id", "name", "address", "network") VALUES ('MAIN.TRX', 'TRX', '0xf230b790e05390fc8295f4d3f60332c93bed42e2', 'MAIN');
-- INSERT INTO "tokens" ("id", "name", "address", "network") VALUES ('RINKEBY.ERC20', 'ERC20', '0x9edcb9a9c4d34b5d6a082c86cb4f117a1394f831', 'RINKEBY');

INSERT INTO "wallets" ("id", "address", "network", "version") VALUES ('MAIN.0xe63d69675DC68d0972Fa53fb15E355bC29f7D1a1', '0xe63d69675DC68d0972Fa53fb15E355bC29f7D1a1', 'MAIN', 1);
-- INSERT INTO "wallets" ("id", "address", "network", "version") VALUES ('MAIN.0x7C5B65130043864137099BE6CCeDa71fC7e7e5a6', '0x7C5B65130043864137099BE6CCeDa71fC7e7e5a6', 'MAIN');
-- INSERT INTO "wallets" ("id", "address", "network", "version") VALUES ('RINKEBY.0x9edcb9a9c4d34b5d6a082c86cb4f117a1394f831', '0x9edcb9a9c4d34b5d6a082c86cb4f117a1394f831', 'RINKEBY');

-- INSERT INTO "tokensBalances" ("walletId", "tokenId", "balance") VALUES ('MAIN.0xfdFF5327F3058f3409efd8aE9BC472f53C72CEDA', 'MAIN.STX', 3.12345678901234567);
-- INSERT INTO "tokensBalances" ("walletId", "tokenId", "balance") VALUES ('MAIN.0xfdFF5327F3058f3409efd8aE9BC472f53C72CEDA', 'MAIN.EOS', 1.23863478901234567);

INSERT INTO "tokensTransfersReads" ("tokenId", "lastReadBlockNumber") VALUES ('MAIN.STX', 0);
-- INSERT INTO "tokensTransfersReads" ("tokenId", "lastReadBlockNumber") VALUES ('MAIN.EOS', 0);
-- INSERT INTO "tokensTransfersReads" ("tokenId", "lastReadBlockNumber") VALUES ('MAIN.TRX', 0);
-- INSERT INTO "tokensTransfersReads" ("tokenId", "lastReadBlockNumber") VALUES ('RINKEBY.ERC20', 0);

