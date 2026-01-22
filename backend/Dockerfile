# ============================================================================
# Production Dockerfile - Optimized for CI/CD and Hugging Face Spaces
# ============================================================================

# Stage 1: Builder - Install dependencies and download models
FROM python:3.10-slim as builder

WORKDIR /app

# Install build dependencies (only needed for compilation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first (for better layer caching in CI/CD)
COPY requirements.txt .

# Install Python dependencies with pip cache mount for faster rebuilds
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --user --no-cache-dir -r requirements.txt

# Pre-download the embedding model during build (saves startup time)
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# ============================================================================
# Stage 2: Runtime - Minimal production image
# ============================================================================
FROM python:3.10-slim

WORKDIR /app

# Install only runtime dependencies (no build tools needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmupdf-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user first (before copying files)
RUN useradd -m -u 1000 appuser

# Copy installed packages from builder to user's home
COPY --from=builder /root/.local /home/appuser/.local

# Copy application code (this layer changes most frequently)
COPY app/ ./app/
COPY run.py .

# Set ownership and permissions
RUN chown -R appuser:appuser /app && \
    chown -R appuser:appuser /home/appuser

# Make sure scripts in .local are usable
ENV PATH=/home/appuser/.local/bin:$PATH

# Set Python environment variables for optimization
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set cache directory for non-root user
ENV HF_HOME=/home/appuser/.cache/huggingface \
    TRANSFORMERS_CACHE=/home/appuser/.cache/huggingface

# Switch to non-root user
USER appuser

# Expose the port Hugging Face Spaces expects
EXPOSE 7860

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:7860/')" || exit 1

# Use uvicorn with production settings optimized for CI/CD deployments
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1", "--log-level", "info", "--no-access-log"]
