"use client";

import { onAuthStateChanged, signInAnonymously, signOut, type User } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { AlertCircle, CheckCircle2, LogIn, LogOut, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { getFirebaseClient, isFirebaseConfigured } from "@/lib/firebase/client";

type ActionStatus = "idle" | "working" | "success" | "error";

const envKeys = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

export function FirebaseStatusPanel() {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<ActionStatus>("idle");
  const [message, setMessage] = useState(configured ? "Waiting" : "Firebase env required");

  useEffect(() => {
    if (!configured) {
      return;
    }

    const { auth } = getFirebaseClient();
    return onAuthStateChanged(auth, setUser);
  }, [configured]);

  async function login() {
    setStatus("working");
    setMessage("Checking Auth");

    try {
      const { auth } = getFirebaseClient();
      await signInAnonymously(auth);
      setStatus("success");
      setMessage("Auth connected");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Auth failed");
    }
  }

  async function logout() {
    const { auth } = getFirebaseClient();
    await signOut(auth);
    setStatus("idle");
    setMessage("Signed out");
  }

  async function runDataCheck() {
    setStatus("working");
    setMessage("Checking Firestore and Storage");

    try {
      const { auth, db, storage } = getFirebaseClient();
      const currentUser = auth.currentUser ?? (await signInAnonymously(auth)).user;
      const createdAt = new Date().toISOString();

      await addDoc(collection(db, "systemChecks"), {
        ownerId: currentUser.uid,
        source: "web",
        status: "ok",
        createdAt: serverTimestamp(),
      });

      const file = new Blob([`KIBA Firebase storage check ${createdAt}`], {
        type: "text/plain",
      });
      await uploadBytes(ref(storage, `users/${currentUser.uid}/system-checks/${Date.now()}.txt`), file);

      setStatus("success");
      setMessage("Firestore write and Storage upload complete");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Connection check failed");
    }
  }

  const statusClass =
    status === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "error"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : status === "working"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-zinc-200 bg-zinc-50 text-zinc-700";

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">Firebase connection</p>
          <h2 className="mt-1 text-xl font-semibold text-zinc-950">Auth, Firestore, Storage</h2>
        </div>
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${statusClass}`}>
          {status === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{message}</span>
        </div>
      </div>

      {!configured ? (
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {envKeys.map((key) => (
            <div key={key} className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700">
              {key}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={user ? logout : login}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            {user ? <LogOut size={18} /> : <LogIn size={18} />}
            {user ? "Sign out" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={runDataCheck}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
          >
            <UploadCloud size={18} />
            Data check
          </button>
        </div>
      )}

      <div className="mt-5 border-t border-zinc-200 pt-4 text-sm text-zinc-600">
        <span className="font-medium text-zinc-900">Current UID</span>
        <span className="ml-2 font-mono">{user?.uid ?? "none"}</span>
      </div>
    </section>
  );
}
