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

CREATE TABLE "pendingRequests"
(
    type CHARACTER VARYING(30) PRIMARY KEY,
    count INTEGER NOT NULL,
    "updatedAt" timestamp with time zone default CURRENT_DATE NOT NULL
);

INSERT INTO "tokens" ("id", "name", "address", "network") VALUES ('MAIN.0x006bea43baa3f7a6f765f14f10a1a1b08334ef45', 'STX', '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45', 'MAIN');
INSERT INTO "pendingRequests" ("type", "count", "updatedAt") VALUES ('createWallet', 0, NOW());
--INSERT INTO public.wallets (id, address, network, "createdAt", "assignedAt", "setWithdrawAddressAt", "corruptedAt", version, "updatedAt") VALUES ('MAIN.0x14a54f7111f5c13fbb8b8cc99fe98a402f9a7daf', '0x14a54f7111f5c13fbb8b8cc99fe98a402f9a7daf', 'MAIN', '2018-01-31 15:34:49.475000', null, null, null, 1, '2018-02-04 15:52:29.825000');
--INSERT INTO public.wallets (id, address, network, "createdAt", "assignedAt", "setWithdrawAddressAt", "corruptedAt", version, "updatedAt") VALUES ('MAIN.0x10141b72402ca6de7f2a69f0f53a4468c1f045ef', '0x10141b72402ca6de7f2a69f0f53a4468c1f045ef', 'MAIN', '2018-02-01 09:03:14.585000', null, null, null, 1, '2018-02-05 13:26:56.816000');
--INSERT INTO public.wallets (id, address, network, "createdAt", "assignedAt", "setWithdrawAddressAt", "corruptedAt", version, "updatedAt") VALUES ('MAIN.0x4205534040757a83034cd38c1f5fcc04091623c6', '0x4205534040757a83034cd38c1f5fcc04091623c6', 'MAIN', '2018-02-01 09:03:09.113000', null, null, null, 1, '2018-02-01 12:48:45.913000');
--INSERT INTO public.wallets (id, address, network, "createdAt", "assignedAt", "setWithdrawAddressAt", "corruptedAt", version, "updatedAt") VALUES ('MAIN.0x8d1d6906a8d19e465b677ebd498062f7092a03a7', '0x8d1d6906a8d19e465b677ebd498062f7092a03a7', 'MAIN', '2018-01-31 15:34:53.065000', null, null, null, 1, '2018-02-01 12:42:19.643000');
--INSERT INTO public.wallets (id, address, network, "createdAt", "assignedAt", "setWithdrawAddressAt", "corruptedAt", version, "updatedAt") VALUES ('MAIN.0x7be7227dbb2f641cdc638bc64296a63fa5863343', '0x7be7227dbb2f641cdc638bc64296a63fa5863343', 'MAIN', '2018-02-01 09:02:58.541000', null, null, null, 1, '2018-02-01 09:02:58.541000');
--INSERT INTO public.wallets (id, address, network, "createdAt", "assignedAt", "setWithdrawAddressAt", "corruptedAt", version, "updatedAt") VALUES ('MAIN.0x6b285e3f6b8c8d3f2600137a7b91a7e2b15d3b47', '0x6b285e3f6b8c8d3f2600137a7b91a7e2b15d3b47', 'MAIN', '2018-01-31 15:34:45.520000', null, null, null, 1, '2018-02-04 09:54:48.370000');
--INSERT INTO public.wallets (id, address, network, "createdAt", "assignedAt", "setWithdrawAddressAt", "corruptedAt", version, "updatedAt") VALUES ('MAIN.0x953c9d9264e0b3cb489adc22b88e79acbf9f8ffb', '0x953c9d9264e0b3cb489adc22b88e79acbf9f8ffb', 'MAIN', '2018-01-31 15:34:41.428000', null, null, null, 1, '2018-02-04 09:06:38.117000');
--INSERT INTO public.wallets (id, address, network, "createdAt", "assignedAt", "setWithdrawAddressAt", "corruptedAt", version, "updatedAt") VALUES ('MAIN.0x8f1627c190613f3ed1f8af81b66df6144fc6c94f', '0x8f1627c190613f3ed1f8af81b66df6144fc6c94f', 'MAIN', '2018-01-31 15:34:34.605000', null, null, null, 1, '2018-02-01 15:39:21.607000');