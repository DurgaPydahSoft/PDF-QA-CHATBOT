# Build Time Optimization - CPU-Only PyTorch

## Problem Identified

The Docker build was taking **~7+ minutes** because:

1. **PyTorch with CUDA**: `sentence-transformers` was pulling in full PyTorch with CUDA support
   - `torch`: 915 MB
   - `nvidia-cudnn-cu12`: 706 MB  
   - `nvidia-cublas-cu12`: 594 MB
   - Plus 20+ other CUDA packages = **~3GB total**
   
2. **Unnecessary for CPU-only deployment**: Hugging Face Spaces runs on CPU, not GPU

3. **Slow cache export**: 268 seconds (normal for HF, but we can't control this)

## Solution Applied

### 1. Force CPU-Only PyTorch

**Before:**
```dockerfile
RUN pip install -r requirements.txt
# This pulled in full PyTorch with CUDA (~3GB)
```

**After:**
```dockerfile
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install -r requirements.txt
# This installs CPU-only PyTorch (~200MB)
```

### 2. Updated requirements.txt

- Removed `torch` from requirements.txt
- Added comment explaining it's installed separately as CPU-only
- Organized dependencies by category for clarity

### 3. Optimized chown Operation

**Before:**
```dockerfile
RUN chown -R appuser:appuser /app && \
    chown -R appuser:appuser /home/appuser
```

**After:**
```dockerfile
RUN chown -R appuser:appuser /app /home/appuser
```

## Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **PyTorch Download** | ~3GB | ~200MB | **93% smaller** |
| **Pip Install Time** | ~113s | ~30-40s | **65% faster** |
| **Total Build Time** | ~7-8 min | ~4-5 min | **40% faster** |
| **Image Size** | ~1.2GB | ~600MB | **50% smaller** |

## Build Time Breakdown (Expected)

- System deps: ~18s
- **Pip install: ~30-40s** (was 113s) ⚡
- Model download: ~8s
- File operations: ~6s
- chown: ~5s (was 17s) ⚡
- Push image: ~53s
- Cache export: ~268s (unchanged - HF controlled)

**Total: ~4-5 minutes** (down from 7-8 minutes)

## Verification

After pushing, check the build logs:
- Look for: `torch` installation from CPU index
- Should see: Much smaller download sizes
- Should NOT see: `nvidia-*` packages

## Notes

- **Cache export time (268s)**: This is controlled by Hugging Face and can't be optimized
- **CPU-only PyTorch**: Perfectly fine for embeddings (sentence-transformers doesn't need GPU)
- **Future builds**: Will be even faster due to Docker layer caching

---

**Last Updated:** 2025-01-27
