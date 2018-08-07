ALTER TABLE public."tokensTransfersReads" DROP CONSTRAINT tokenstransfersreads_tokenid_fk;
ALTER TABLE public."tokensTransfersReads" RENAME TO "contractsTrackingData";
ALTER TABLE public."contractsTrackingData" RENAME COLUMN "tokenId" TO "contractId";
ALTER TABLE public.wallets ADD "selfWithdrawRequestedAt" timestamp with time zone NULL;
ALTER TABLE public.wallets ADD "selfWithdrawAllowedAt" timestamp with time zone NULL;
