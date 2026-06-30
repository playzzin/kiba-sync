import { BigQuery } from "@google-cloud/bigquery";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { z } from "zod";

initializeApp();

const db = getFirestore();
const bigquery = new BigQuery();
const region = process.env.FUNCTIONS_REGION || "asia-northeast3";
const bigQueryDataset = process.env.BIGQUERY_DATASET || "kiba_erp";
const auditTable = process.env.BIGQUERY_AUDIT_TABLE || "audit_events";

const auditEventSchema = z.object({
  action: z.string().min(2).max(120),
  targetType: z.string().min(2).max(80),
  targetId: z.string().min(1).max(180),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

function toMonthKey(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString().slice(0, 7);
  }

  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 7);
    }
  }

  return new Date().toISOString().slice(0, 7);
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export const createAuditLog = onCall({ region }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  const parsed = auditEventSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid audit log payload.", parsed.error.flatten());
  }

  const doc = await db.collection("auditLogs").add({
    actorId: request.auth.uid,
    actorEmail: request.auth.token.email ?? null,
    ...parsed.data,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { id: doc.id };
});

export const exportAuditLogToBigQuery = onDocumentCreated(
  { document: "auditLogs/{auditId}", region },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      return;
    }

    const data = snapshot.data();

    try {
      await bigquery.dataset(bigQueryDataset).table(auditTable).insert([
        {
          auditId: event.params.auditId,
          actorId: data.actorId ?? null,
          actorEmail: data.actorEmail ?? null,
          action: data.action ?? null,
          targetType: data.targetType ?? null,
          targetId: data.targetId ?? null,
          metadata: JSON.stringify(data.metadata ?? {}),
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      logger.error("BigQuery audit export failed", error);
      throw error;
    }
  },
);

export const aggregateContractCreated = onDocumentCreated(
  { document: "contracts/{contractId}", region },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      return;
    }

    const data = snapshot.data();
    const month = toMonthKey(data.signedAt ?? data.createdAt);
    const amount = toNumber(data.amount);

    await db.doc(`stats/monthly/contracts/${month}`).set(
      {
        month,
        contractCount: FieldValue.increment(1),
        contractAmount: FieldValue.increment(amount),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  },
);
