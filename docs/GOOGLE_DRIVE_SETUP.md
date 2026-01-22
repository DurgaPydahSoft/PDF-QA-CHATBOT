# Google Drive Sync Setup Guide

This guide explains how to configure Google Drive sync for both **local development** and **production (Hugging Face Spaces/Docker)**.

---

## 🔧 Problem Solved

The "Invalid JWT Signature" error occurs when the private key from the service account JSON is not properly formatted, especially when passed through environment variables. This solution uses **Base64 encoding** to preserve the exact key format.

---

## 📋 Prerequisites

1. Google Cloud Project with Drive API enabled
2. Service Account JSON file
3. Hugging Face Space (for production) or Docker environment

---

## 🏠 Local Development Setup

### Step 1: Place Service Account File

Place your `service_account.json` file in the `backend/` directory:

```
backend/
  ├── service_account.json  ← Your service account file
  ├── app/
  └── ...
```

### Step 2: Verify `.gitignore`

Ensure `service_account.json` is in `.gitignore` (it should already be):

```gitignore
service_account.json
```

### Step 3: Run Locally

The app will automatically detect and use the local file:

```bash
cd backend
python run.py
```

**That's it!** The local file takes priority for development.

---

## 🚀 Production Setup (Hugging Face Spaces / Docker)

### Step 1: Base64 Encode Your Service Account JSON

**On your local machine:**

```bash
# Linux/Mac
base64 service_account.json > service_account.b64

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("service_account.json")) | Out-File -Encoding ASCII service_account.b64

# Or using Python
python -c "import base64; print(base64.b64encode(open('service_account.json', 'rb').read()).decode())"
```

Copy the entire Base64 string (it will be one long line).

### Step 2: Add to Hugging Face Secrets

1. Go to your **Hugging Face Space**
2. Navigate to **Settings** → **Secrets**
3. Add a new secret:

   | Key | Value |
   |-----|-------|
   | `GOOGLE_SA_KEY_BASE64` | `(paste your entire Base64 string here)` |

4. Click **Save**

### Step 3: Verify Other Required Secrets

Make sure you also have these secrets configured:

- `MONGODB_URI` - Your MongoDB Atlas connection string
- `DRIVE_FOLDER_ID` - Google Drive folder ID to sync
- `OPENROUTER_API_KEY` - For LLM responses

### Step 4: Deploy

The app will automatically:
1. ✅ Check for `GOOGLE_SA_KEY_BASE64` first (production)
2. ✅ Fall back to individual env vars if needed
3. ✅ Use local file only in development

---

## 🔄 Credential Loading Priority

The system checks credentials in this order:

1. **`GOOGLE_SA_KEY_BASE64`** (Base64-encoded JSON) ← **Production Priority**
2. Individual environment variables (`GOOGLE_PRIVATE_KEY`, `GOOGLE_CLIENT_EMAIL`, etc.)
3. **`GOOGLE_SERVICE_ACCOUNT_JSON`** (Raw JSON string)
4. **`service_account.json`** (Local file) ← **Development Priority**

---

## ✅ Verification

### Check Logs

When the app starts, you should see one of these messages:

**Production:**
```
Using Google credentials from Base64-encoded environment variable (GOOGLE_SA_KEY_BASE64).
Successfully decoded Base64 service account credentials.
```

**Development:**
```
Using Google credentials from local file: service_account.json
```

### Test Drive Sync

1. Navigate to the **Google Drive** tab in the UI
2. Check the status panel - it should show:
   - ✅ Service account email
   - ✅ Project ID
   - ✅ File count
3. Click **Sync Now** to trigger a manual sync
4. Check backend logs for sync progress

---

## 🐛 Troubleshooting

### Error: "Invalid JWT Signature"

**Cause:** Private key format is corrupted or incorrect.

**Solution:**
- ✅ Use Base64 encoding (`GOOGLE_SA_KEY_BASE64`) in production
- ✅ Ensure the Base64 string is complete (no line breaks)
- ✅ Verify the original JSON file is valid

### Error: "No Google credentials found"

**Cause:** No credentials are configured.

**Solution:**
- Check that `GOOGLE_SA_KEY_BASE64` is set in HF Secrets
- Or ensure `service_account.json` exists locally
- Verify the secret name matches exactly (case-sensitive)

### Error: "Error decoding Base64 credentials"

**Cause:** Invalid Base64 string.

**Solution:**
- Re-encode the JSON file
- Ensure no extra whitespace or line breaks in the secret
- Test Base64 encoding locally first

### Works Locally, Fails in Production

**Cause:** Environment variable formatting issues.

**Solution:**
- ✅ Use `GOOGLE_SA_KEY_BASE64` instead of individual env vars
- ✅ Base64 encoding preserves exact key format
- ✅ Avoids newline/whitespace issues

---

## 📝 Code Changes Summary

The updated `drive_sync.py` now:

1. ✅ **Imports `base64`** for decoding
2. ✅ **Checks `GOOGLE_SA_KEY_BASE64` first** (production priority)
3. ✅ **Decodes Base64 → JSON → dict** automatically
4. ✅ **Maintains backward compatibility** with all existing methods
5. ✅ **Properly sanitizes private key** for JWT signature validation

---

## 🔒 Security Best Practices

✅ **DO:**
- Use Base64 encoding in production (HF Secrets)
- Keep `service_account.json` in `.gitignore`
- Use read-only Drive API scope
- Rotate service account keys periodically

❌ **DON'T:**
- Commit service account JSON to git
- Use multiline private keys in environment variables
- Hardcode credentials in code
- Share service account keys publicly

---

## 📚 Additional Resources

- [Google Service Account Documentation](https://cloud.google.com/iam/docs/service-accounts)
- [Hugging Face Spaces Secrets](https://huggingface.co/docs/hub/spaces-sdks-docker#secrets-management)
- [Google Drive API Setup](https://developers.google.com/drive/api/quickstart/python)

---

## 🎯 Quick Reference

| Environment | Method | Secret/File |
|------------|--------|-------------|
| **Local** | File | `backend/service_account.json` |
| **Production** | Base64 Env Var | `GOOGLE_SA_KEY_BASE64` |

---

**Last Updated:** 2025-01-27
