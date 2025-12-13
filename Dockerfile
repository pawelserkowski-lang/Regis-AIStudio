# =============================================================================
# Regis AI Studio - Multi-Stage Dockerfile
# =============================================================================
# Stage 1: Build Frontend (React + Vite)
# Stage 2: Setup Python Backend
# Stage 3: Production Runtime
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Frontend Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Production Runtime
# -----------------------------------------------------------------------------
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python backend
COPY api/ ./api/

# Install Python dependencies
RUN pip install --no-cache-dir -r api/requirements.txt

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/dist ./dist
COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/index.html ./index.html

# Create non-root user for security
RUN useradd -m -u 1000 regis && \
    chown -R regis:regis /app

USER regis

# Expose ports
# 8000: Python backend API
# 5173: Vite dev server (if needed for development)
EXPOSE 8000

# Environment variables
ENV PORT=8000
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Start Python backend server
CMD ["python", "api/local_server.py"]
