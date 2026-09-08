# Deployment & DevOps Specification
## Interactive Learning & Assessment Platform

---

## 1. Firebase App Hosting Architecture
The platform is packaged for zero-friction deployment to **Firebase App Hosting**, Google Cloud's modern next-generation hosting platform for Next.js full-stack applications.

- **Underlying Engine:** Google Cloud Run (containerized Next.js server runtime) paired with Google Cloud CDN for edge caching of static assets.
- **Git Integration:** Direct automated builds and deployments triggered from the GitHub repository (`main` branch).
- **Environment Management:** Production and Staging secrets injected via Google Cloud Secret Manager.

---

## 2. Configuration Specification (`apphosting.yaml`)

```yaml
kind: AppHostingYaml
version: v1alpha

runConfig:
  minInstances: 0        # Scale-to-zero during idle hours to minimize costs
  maxInstances: 10       # Max instances during peak university exam hours
  concurrency: 80
  cpu: 1
  memoryMiB: 1024

env:
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    value: os-assessment-platform
  - variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    value: os-assessment-platform.firebaseapp.com
  - variable: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    value: os-assessment-platform.appspot.com
  - variable: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    value: "123456789012"
  - variable: NEXT_PUBLIC_FIREBASE_APP_ID
    value: "1:123456789012:web:abcdef123456"
  - variable: NEXT_PUBLIC_APP_CHECK_SITE_KEY
    value: "6Lxxxx..."
  # Private server secrets stored in Google Cloud Secret Manager
  - variable: FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
    secret: firebase-admin-key
  - variable: GEMINI_API_KEY
    secret: gemini-api-key
    availability:
      - RUNTIME
```

---

## 3. Cost & Billing Analysis

### 3.1 Services That Will Eventually Require Billing (Blaze Plan)
1. **Firebase App Hosting:** Requires the Blaze (Pay-as-you-go) plan because it deploys on Google Cloud Run. (Includes monthly free tier allocations: 2M Cloud Run requests, 360,000 vCPU-seconds, 180,000 GiB-seconds).
2. **Cloud Firestore:** Generous free tier (50,000 reads/day, 20,000 writes/day, 1 GB storage). University class cohorts of 100-300 students easily fit within or slightly above free tier depending on exam frequency.
3. **Google Cloud Secret Manager:** $0.06 per active secret version/month (first 6 secret versions free).
4. **Firebase App Check (reCAPTCHA Enterprise):** 10,000 free verifications per month; $1 per 1,000 calls thereafter.
5. **Firebase Storage (if enabled for image/diagram uploads):** 5 GB free storage.

### 3.2 Safe Defaults (Zero-Cost Prototyping)
- **Local Development:** 100% free via Firebase Emulator Suite (`firebase emulators:start`). Requires no billing account or credit card.
- **Firebase Auth:** Free for standard Email/Password and Google OAuth sign-in up to 50,000 monthly active users.
- **Region Default:** `us-central1` (or `nam5` multi-region for Firestore) provides standard low-latency access and maximizes free tier allowances.

---

## 4. Pre-Flight Production Checklist
Before triggering a production deployment:

- [ ] `npm run lint` passes with 0 warnings/errors.
- [ ] `npm run typecheck` passes with 0 TypeScript compiler errors.
- [ ] `npm run test` executes all unit tests with 100% pass rate.
- [ ] `npm run build` succeeds locally, producing optimized production bundles.
- [ ] Verify `firestore.rules` are deployed and deny-by-default is active.
- [ ] Verify no secrets (`.env`, private keys, API credentials) are committed to git or exposed in `NEXT_PUBLIC_` variables.
- [ ] Verify App Check token enforcement is enabled in production mode.
- [ ] Verify required Firestore composite indexes are provisioned via `firestore.indexes.json`.
