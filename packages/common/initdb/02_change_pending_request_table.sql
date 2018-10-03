drop table "pendingRequests";

CREATE TABLE "pendingRequests"
(
   "requestId" UUID NOT NULL PRIMARY KEY,
   type CHARACTER VARYING(30)
);
