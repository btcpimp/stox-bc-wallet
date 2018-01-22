CREATE TABLE "networks"
(
    "name" character(42) PRIMARY KEY,
    CONSTRAINT network_name_key UNIQUE ("name")
)

CREATE TABLE "tokens"
(
    "name" character(42) PRIMARY KEY,
    "displayName" character(42) NOT NULL,
    "address" character(42) NOT NULL
)

CREATE TABLE "wallets"
(
    "address" character(42) PRIMARY KEY,
    "network" character(42) NOT NULL,
    "createdAt" timestamp with time zone default CURRENT_DATE NOT NULL,
    "assignedAt" timestamp with time zone,
    CONSTRAINT wallets_network_fk FOREIGN KEY ("network")
        REFERENCES "networks" ("name") MATCH SIMPLE
)

CREATE TABLE "transactions"
(
    "id" SERIAL PRIMARY KEY,
    "transactionHash" character(66) NOT NULL,
    "transactionIndex" integer,
    "address" character(42) NOT NULL,
    "network" character(42) NOT NULL,
    "blockNumber" bigint NOT NULL,
    "from" character(42) NOT NULL,
    "to" character(42) NOT NULL,
    "amount" numeric(38, 18),
    "rawData" json,
    CONSTRAINT transactionlog_network_fk FOREIGN KEY ("network")
        REFERENCES "networks" ("name") MATCH SIMPLE
)

CREATE TABLE "transactionsManagement"
(
    "token" character(42) PRIMARY KEY,
    "lastReadBlock" bigint NOT NULL
)

CREATE TABLE "walletsBalance"
(

    "walletAddress" character(42) NOT NULL,
    "token" character(42) NOT NULL,
    "balance" numeric(38,18) NOT NULL,
    "createdAt" timestamp with time zone default CURRENT_DATE NOT NULL,
    "updatedAt" timestamp with time zone default CURRENT_DATE,
    CONSTRAINT walletsbalance_walletaddress_fk FOREIGN KEY ("walletAddress")
        REFERENCES "wallets" ("address") MATCH SIMPLE,
    CONSTRAINT walletsbalance_token_fk FOREIGN KEY ("token")
        REFERENCES "tokens" ("name") MATCH SIMPLE
)

CREATE INDEX wallets_assigned_at ON "wallets" USING btree ("assignedAt");
CREATE INDEX wallets_created_at ON "wallets" USING btree ("createdAt");
CREATE INDEX walletsbalance_balance ON "walletsBalance" USING btree (balance);
CREATE INDEX walletsbalance_updated_at ON "walletsBalance" USING btree ("updatedAt");

INSERT INTO "networks" ("name") VALUES ('MAIN');
INSERT INTO "networks" ("name") VALUES ('RINKEBY');

INSERT INTO "tokens" ("name", "displayName", "address") VALUES ('MAIN.STX', 'STX', '0x006bea43baa3f7a6f765f14f10a1a1b08334ef45');
INSERT INTO "tokens" ("name", "displayName", "address") VALUES ('MAIN.EOS', 'EOS', '0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0');
INSERT INTO "tokens" ("name", "displayName", "address") VALUES ('MAIN.TRX', 'TRX', '0xf230b790e05390fc8295f4d3f60332c93bed42e2');
INSERT INTO "tokens" ("name", "displayName", "address") VALUES ('RINKEBY.ERC20', 'ERC20', '0x9edcb9a9c4d34b5d6a082c86cb4f117a1394f831');

INSERT INTO "transactionsManagement" ("token", "lastReadBlock") VALUES ('MAIN.STX', 0);
INSERT INTO "transactionsManagement" ("token", "lastReadBlock") VALUES ('MAIN.EOS', 0);
INSERT INTO "transactionsManagement" ("token", "lastReadBlock") VALUES ('MAIN.TRX', 0);
INSERT INTO "transactionsManagement" ("token", "lastReadBlock") VALUES ('RINKEBY.ERC20', 0);

INSERT INTO "wallets" ("address", "network") VALUES ('0xfdFF5327F3058f3409efd8aE9BC472f53C72CEDA', 'MAIN');
INSERT INTO "wallets" ("address", "network") VALUES ('0x7C5B65130043864137099BE6CCeDa71fC7e7e5a6', 'MAIN');
INSERT INTO "wallets" ("address", "network") VALUES ('0x9edcb9a9c4d34b5d6a082c86cb4f117a1394f831', 'RINKEBY');