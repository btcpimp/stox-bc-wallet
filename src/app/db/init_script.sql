CREATE TABLE wallets (
    "address" character varying(42),
    "token" character varying(42),
    "balance" numeric(36,18) NOT NULL,
    "createdAt" timestamp with time zone,
    "assignedAt" timestamp with time zone
);

CREATE TABLE eventsLog (
    "txHash" character varying(42),
    "block" character varying(42),
    "from" character varying(42),
    "to" character varying(42),
    "token" character varying(42),
    "amount" numeric(36,18) NOT NULL
);