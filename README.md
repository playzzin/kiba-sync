# KIBA ERP CRM CMS Firebase Foundation

This project is a Next.js + TypeScript frontend with Firebase Auth, Cloud Firestore, Firebase Storage, Cloud Functions, Firebase Hosting, and BigQuery integration scaffolding.

## Stack

- Next.js static export for Firebase Hosting
- Firebase Auth for user identity
- Cloud Firestore for ERP, CRM, and CMS documents
- Firebase Storage for contracts and attachments
- Cloud Functions for privileged jobs and aggregations
- BigQuery for audit and reporting exports

## Local setup

1. Create a Firebase project.
2. Enable Auth, Firestore, Storage, Functions, Hosting, and BigQuery in Google Cloud.
3. Copy `.env.example` to `.env.local`.
4. Fill in the Firebase web app config values.
5. Copy `functions/.env.example` to `functions/.env`.
6. Install dependencies if needed:

```bash
npm install
npm --prefix functions install
```

7. Run the frontend:

```bash
npm run dev
```

## Firebase project binding

Use Firebase CLI to bind the local folder to your project:

```bash
firebase login
firebase use --add
```

You can also deploy with an explicit project:

```bash
firebase deploy --project your-firebase-project-id
```

## BigQuery table

Create the audit table before deploying the BigQuery export function. Replace `PROJECT_ID` in `infra/bigquery-audit-events.sql`.

```bash
bq query --use_legacy_sql=false < infra/bigquery-audit-events.sql
```

## Emulators

Set this in `.env.local` when using local Firebase emulators:

```bash
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
```

Start emulators:

```bash
npm run firebase:emulators
```

Emulator UI:

```txt
http://127.0.0.1:4000
```

## KIBA public site migration

The user site mode mirrors the original KIBA public menu structure:

- 연구원 소개
- 주요실적
- 학술연구
- 원가계산안내
- 계약금액조정
- 개발부담금
- 클레임
- 고객센터

Scrape the original KIBA pages and regenerate the local seed file:

```bash
npm run kiba:scrape
```

This writes `data/kiba-content.seed.json` with:

- `cmsMenus`: 8 top-level menus and 34 child menus
- `cmsPages`: 34 original source pages
- `cmsAssets`: source images mapped to `public/kiba/source/...`
- `boardPosts`: notice, resource, and inquiry board source rows

Preview the Firestore write plan without changing data:

```bash
npm run kiba:seed:firestore -- --dry-run
```

Seed Firestore after configuring credentials:

```bash
$env:FIREBASE_PROJECT_ID="your-firebase-project-id"
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
npm run kiba:seed:firestore
```

For the local emulator, start emulators and run the seed with `$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"`.

## Deploy

```bash
npm run build
npm --prefix functions run build
firebase deploy
```

## Initial admin role

The Firestore and Storage rules use `users/{uid}.role`.

Allowed staff roles:

```txt
admin
manager
staff
```

After the first user signs in, set that user document manually in the Firebase Console:

```json
{
  "role": "admin",
  "displayName": "Initial Admin"
}
```

## Main collections

- `cmsPages`
- `cmsMenus`
- `cmsAssets`
- `boardPosts`
- `clients`
- `contacts`
- `projects`
- `contracts`
- `invoices`
- `settlements`
- `payments`
- `auditLogs`
- `stats`
