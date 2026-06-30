import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const requireFromFunctions = createRequire(new URL("../functions/package.json", import.meta.url));
const { applicationDefault, cert, getApps, initializeApp } = requireFromFunctions("firebase-admin/app");
const { FieldValue, getFirestore } = requireFromFunctions("firebase-admin/firestore");

const seedPath = path.resolve("data/kiba-content.seed.json");
const dryRun = process.argv.includes("--dry-run");
const collectionMap = {
  cmsMenus: "cmsMenus",
  cmsPages: "cmsPages",
  cmsAssets: "cmsAssets",
  boardPosts: "boardPosts",
};

function resolveCredential() {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return undefined;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
  }

  return applicationDefault();
}

function initializeFirebase() {
  if (getApps().length > 0) {
    return;
  }

  const options = {};
  const credential = resolveCredential();
  if (credential) {
    options.credential = credential;
  }
  if (process.env.FIREBASE_PROJECT_ID) {
    options.projectId = process.env.FIREBASE_PROJECT_ID;
  }

  initializeApp(options);
}

async function commitInBatches(db, writes) {
  const chunkSize = 450;
  let committed = 0;

  for (let index = 0; index < writes.length; index += chunkSize) {
    const chunk = writes.slice(index, index + chunkSize);
    const batch = db.batch();

    for (const write of chunk) {
      batch.set(write.ref, write.data, { merge: true });
    }

    await batch.commit();
    committed += chunk.length;
    console.log(`Committed ${committed}/${writes.length}`);
  }
}

const seed = JSON.parse(await readFile(seedPath, "utf8"));
const writes = [];

initializeFirebase();
const db = getFirestore();

for (const [seedKey, collectionName] of Object.entries(collectionMap)) {
  const docs = seed.firestore?.[seedKey] ?? [];
  for (const doc of docs) {
    const { id, ...data } = doc;
    writes.push({
      ref: db.collection(collectionName).doc(id),
      data: {
        ...data,
        sourceSeedGeneratedAt: seed.generatedAt,
        updatedAt: FieldValue.serverTimestamp(),
      },
    });
  }
}

console.log(
  JSON.stringify(
    {
      dryRun,
      seedPath,
      generatedAt: seed.generatedAt,
      collections: Object.fromEntries(
        Object.entries(collectionMap).map(([seedKey, collectionName]) => [
          collectionName,
          seed.firestore?.[seedKey]?.length ?? 0,
        ]),
      ),
      totalWrites: writes.length,
    },
    null,
    2,
  ),
);

if (dryRun) {
  process.exit(0);
}

await commitInBatches(db, writes);
console.log("KIBA Firestore seed completed.");
