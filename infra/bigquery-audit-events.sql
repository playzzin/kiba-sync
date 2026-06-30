CREATE SCHEMA IF NOT EXISTS `PROJECT_ID.kiba_erp`
OPTIONS (
  location = "asia-northeast3"
);

CREATE TABLE IF NOT EXISTS `PROJECT_ID.kiba_erp.audit_events` (
  auditId STRING NOT NULL,
  actorId STRING,
  actorEmail STRING,
  action STRING,
  targetType STRING,
  targetId STRING,
  metadata JSON,
  createdAt TIMESTAMP NOT NULL
)
PARTITION BY DATE(createdAt)
CLUSTER BY targetType, action;
