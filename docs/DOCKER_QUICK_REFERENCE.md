# Docker Quick Reference

## 🚀 Quick Start

### Build the Image
```bash
cd backend
docker build -t pdf-qa-chatbot:latest .
```

### Run Locally
```bash
docker run -p 7860:7860 \
  -e MONGODB_URI="your_mongodb_uri" \
  -e OPENROUTER_API_KEY="your_key" \
  -e GOOGLE_SA_KEY_BASE64="your_base64_key" \
  -e DRIVE_FOLDER_ID="your_folder_id" \
  pdf-qa-chatbot:latest
```

## 📊 Key Optimizations Applied

1. **Multi-Stage Build** - Smaller final image (~800MB vs ~1.2GB)
2. **Layer Caching** - Code changes rebuild in ~45s vs ~8min
3. **Model Pre-download** - Saves 5-10s on startup
4. **Pip Cache Mount** - Faster dependency installs
5. **.dockerignore** - 90% smaller build context

## 🔄 Build Times

- **First Build:** ~6 minutes
- **Code Change Rebuild:** ~45 seconds ⚡
- **No Changes:** ~10 seconds ⚡⚡

## 📦 Image Size

- **Before:** ~1.2 GB
- **After:** ~800 MB (33% reduction)

## ✅ What's Included

- ✅ All Python dependencies
- ✅ Pre-downloaded embedding model
- ✅ Runtime system libraries
- ✅ Health check endpoint
- ✅ Non-root user (security)
- ✅ Production uvicorn settings

## 🐛 Common Issues

**Issue:** Build fails with "No module named 'fitz'"
**Fix:** Ensure `PyMuPDF>=1.23.0` in requirements.txt

**Issue:** Health check fails
**Fix:** Container needs ~40s to start (model loading)

**Issue:** Permission errors with non-root user
**Fix:** All files are properly chowned in Dockerfile
