import { signInAnonymously } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { ref, uploadString } from "firebase/storage";
import { getFirebaseClient, isFirebaseConfigured } from "@/lib/firebase/client";

export type CostEstimateDraftMode = "unified" | "separate";

export type CostEstimateDraftFileNames = {
  unified?: string;
  priceCompare?: string;
  unitPrice?: string;
  detail?: string;
};

export type CostEstimateDraftRow = {
  id: string;
  code: string;
  category: "material" | "labor" | "expense";
  itemName: string;
  spec: string;
  unit: string;
  qty: string;
  unitPrice: string;
  sourceRow?: number;
  section?: string;
};

export type CostEstimateDraftRates = {
  indirectLabor: string;
  industrialAccident: string;
  employment: string;
  health: string;
  pension: string;
  longTermCare: string;
  asbestos: string;
  wageClaim: string;
  retirement: string;
  safetyHealth: string;
  miscExpense: string;
  generalAdmin: string;
  profit: string;
  vat: string;
};

export type CostEstimateDraftData = {
  mode: CostEstimateDraftMode;
  projectName: string;
  fileNames: CostEstimateDraftFileNames;
  rows: CostEstimateDraftRow[];
  rates: CostEstimateDraftRates;
};

type CostEstimateDraftDocument = {
  ownerId: string;
  version: number;
  updatedAt: ReturnType<typeof serverTimestamp>;
  storagePath: string;
  data: CostEstimateDraftData;
};

async function ensureUserId() {
  const { auth } = getFirebaseClient();
  const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
  return user.uid;
}

export async function saveCostEstimateDraft(data: CostEstimateDraftData) {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase 환경 변수가 설정되지 않았습니다.");
  }

  const { db, storage } = getFirebaseClient();
  const uid = await ensureUserId();
  const storagePath = `users/${uid}/cost-estimate/draft-latest.json`;
  await uploadString(ref(storage, storagePath), JSON.stringify(data), "raw", {
    contentType: "application/json; charset=utf-8",
  });

  const draftDoc: CostEstimateDraftDocument = {
    ownerId: uid,
    version: 1,
    updatedAt: serverTimestamp(),
    storagePath,
    data,
  };

  await setDoc(doc(db, "costEstimateDrafts", uid), draftDoc);
}

export async function loadCostEstimateDraft() {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const { db } = getFirebaseClient();
  const uid = await ensureUserId();
  const snapshot = await getDoc(doc(db, "costEstimateDrafts", uid));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() as Partial<CostEstimateDraftDocument>;
  return data.data ?? null;
}
