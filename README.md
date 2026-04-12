# BertScan – Laravel 13 + Inertia React

An offline-first Android malware scanner backend with a data-hub for telemetry ingestion, moderation, and curated dataset export.

---

## Requirements

- PHP 8.3+
- Node.js 18+
- Composer
- SQLite (default) or MySQL/Postgres

---

## Quick Start

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
npm install
npm run build
php artisan serve
```

---

## Data Hub

The Data Hub is a backend system for:

1. **Authenticated API ingestion** – Mobile clients submit telemetry batch records using a Sanctum token.
2. **Web admin UI** – Authenticated web users review submissions, approve/reject them, and generate CSV dataset exports for manual Colab retraining.

### Routes overview

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/submissions/batch` | Ingest a batch of telemetry submissions (Sanctum token required) |
| `GET` | `/data-hub` | Data Hub dashboard |
| `GET` | `/data-hub/submissions` | Submissions list (with filters) |
| `GET` | `/data-hub/submissions/{id}` | Submission detail |
| `POST` | `/data-hub/submissions/{id}/approve` | Approve a submission |
| `POST` | `/data-hub/submissions/{id}/reject` | Reject a submission |
| `POST` | `/data-hub/submissions/bulk-approve` | Bulk approve submissions |
| `POST` | `/data-hub/submissions/bulk-reject` | Bulk reject submissions |
| `GET` | `/data-hub/exports` | Dataset exports list |
| `GET` | `/data-hub/exports/create` | Export creation form |
| `POST` | `/data-hub/exports` | Create a new export |
| `GET` | `/data-hub/exports/preview` | Preview row count for given filters |
| `GET` | `/data-hub/exports/{id}` | Export detail |
| `GET` | `/data-hub/exports/{id}/download` | Download the CSV file |

---

## Mobile Contributor Auth & Opt-in

Android users who want to contribute anonymised scan telemetry must first register as **contributors** (separate from web admin users).  
No 2FA is required for contributors.

### User types

| Type | Table | Auth method | Use case |
|------|-------|-------------|----------|
| **Admin / staff** | `users` | Web session (Fortify) | Dashboard, moderation, exports |
| **Mobile contributor** | `contributors` | Sanctum bearer token | Opt-in data sharing, telemetry ingestion |

---

### 1. Register

```http
POST /api/v1/contributor/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass1!",
  "password_confirmation": "SecurePass1!",
  "data_sharing_enabled": true,
  "consent_version": "1.0",
  "wifi_only_upload": true,
  "device_name": "Pixel 9"
}
```

**Response (201 Created):**

```json
{
  "message": "Registration successful.",
  "token": "<sanctum_bearer_token>",
  "contributor": {
    "id": 1,
    "email": "user@example.com",
    "data_sharing_enabled": true,
    "consented_at": "2025-01-01T12:00:00+00:00",
    "consent_version": "1.0",
    "wifi_only_upload": true
  }
}
```

> The token is returned immediately on registration – no separate login step needed.  
> Store the token securely (e.g., Android Keystore / EncryptedSharedPreferences).

**Consent semantics:**
- `data_sharing_enabled: true` – contributor opts in; `consented_at` is set automatically to the current timestamp.
- `data_sharing_enabled: false` – contributor registers without opting in; `consented_at` remains `null`. Telemetry ingestion will be blocked until they opt in.
- `consent_version` – record the policy version the user agreed to (e.g. `"1.0"`).
- `wifi_only_upload` – client-side hint; default `true`. Backend does not enforce this.

---

### 2. Login / obtain token

If the user already has an account (e.g. reinstall):

```http
POST /api/v1/contributor/auth/token
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass1!",
  "device_name": "Pixel 9"
}
```

**Response (200 OK):**

```json
{
  "token": "<sanctum_bearer_token>",
  "contributor": { "..." }
}
```

---

### 3. Logout / revoke token

```http
DELETE /api/v1/contributor/auth/token
Authorization: Bearer <sanctum_bearer_token>
```

**Response (200 OK):**

```json
{ "message": "Token revoked." }
```

---

### 4. Batch Ingestion (prerequisite: opted in)

The ingestion endpoint requires:
1. A valid Sanctum bearer token for a **contributor** (not an admin user).
2. `data_sharing_enabled = true` on the contributor's record.

```http
POST /api/v1/submissions/batch
Authorization: Bearer <sanctum_token>
Content-Type: application/json

{
  "device_public_id": "abc-device-001",
  "device_name": "Pixel 9",
  "platform": "android",
  "os_version": "14",
  "app_version": "1.2.3",
  "items": [
    {
      "schema_version": 1,
      "label": "benign",
      "score": 0.023456,
      "package_name": "com.example.app",
      "apk_sha256": "aabbcc...64hexchars",
      "extracted_at": "2025-01-01T12:00:00Z",
      "features": { "feature1": 1, "feature2": 0 },
      "feature_text": "feature1 feature2",
      "pipeline_manifest": {
        "feature_order": "android_static_v1_215",
        "tokenizer": { "type": "whitespace" },
        "model_input": "text"
      },
      "model_version": "v1.0"
    }
  ]
}
```

**Response (201 Created):**

```json
{
  "accepted": 1,
  "rejected": 0,
  "items": [
    { "index": 0, "status": "accepted", "id": 42 }
  ]
}
```

**Validation rules:**

| Field | Rule |
|-------|------|
| `device_public_id` | required, max:64, alphanumeric + dashes |
| `items` | required array, max 100 items per batch |
| `items.*.schema_version` | required integer, 1–9999 |
| `items.*.label` | required, `benign` or `malicious` |
| `items.*.score` | nullable float, 0–1 |
| `items.*.package_name` | required string, max 255 |
| `items.*.apk_sha256` | required, exactly 64 lowercase hex chars |
| `items.*.extracted_at` | nullable ISO8601 date |
| `items.*.features` | required when `feature_text` absent; array, max 500 keys |
| `items.*.feature_text` | required when `features` absent; normalized space-separated active feature names |
| `items.*.pipeline_manifest` | nullable object containing feature/tokenizer/model pipeline metadata |
| `items.*.model_version` | nullable string, max 50 |

**Rate limit:** 60 batch requests per minute per authenticated contributor.

---

### Contributor consent fields (`contributors` table)

| Column | Type | Description |
|--------|------|-------------|
| `data_sharing_enabled` | boolean | Whether the contributor has opted in |
| `consented_at` | timestamp | When consent was granted (set automatically on register when opted in) |
| `consent_version` | string | Version of the consent policy accepted |
| `wifi_only_upload` | boolean | Client preference: upload on Wi-Fi only (default `true`) |

---



## Dataset Export

From the **Data Hub → Exports → New Export** page, select:

- **Schema Version** (required) – only include submissions with this schema version
- **Label Filter** – optional: benign, malicious, or all
- **Date Range** – optional date window
- **Approved Only** – default ON (recommended for training)
- **Unique by APK Hash** – default ON (deduplicates by `apk_sha256`)

The CSV columns are:

```
apk_sha256, package_name, label, schema_version, features_json, feature_text, pipeline_manifest_json, extracted_at, model_version, app_version
```

Download the CSV from the export detail page. Use it directly in Colab for retraining.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_URL` | `http://localhost` | Application base URL |
| `DB_CONNECTION` | `sqlite` | Database driver |
| `FILESYSTEM_DISK` | `local` | Storage disk for CSV exports |
| `SESSION_DRIVER` | `database` | Session backend |
| `SANCTUM_STATEFUL_DOMAINS` | — | Comma-separated domains for Sanctum cookie auth (for SPA) |

---

## Running Tests

```bash
php artisan test
```

Or run just the contributor auth tests:

```bash
php artisan test tests/Feature/Contributor/
```

Or run just the Data Hub tests:

```bash
php artisan test tests/Feature/DataHub/
```

---

## Code Quality

```bash
# PHP formatting
composer lint

# JS/TS linting
npm run lint

# TypeScript type check
npm run types:check

# Full CI check
npm run format && npm run lint && npm run types:check && php artisan test
```
