// ==========================================
// Tissaia - Stage 1: Ingestion & Heuristics
// ==========================================

import { ScanFile, BoundingBox } from './types';
import { PIPELINE_CONFIG } from './config';
import tissaiaLogger from './logger';

const config = PIPELINE_CONFIG.pipeline_configuration.stages.STAGE_1_INGESTION;

/**
 * Load image file and create base64 thumbnail
 */
async function loadImageAsDataUrl(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        resolve({
          dataUrl: reader.result as string,
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Generate thumbnail for preview
 */
async function generateThumbnail(dataUrl: string, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxWidth / img.naturalWidth);
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL(config.config.thumbnail_generation.format, quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Heuristic analysis using edge detection and line analysis
 * Estimates the number of photos in a scanned album page
 */
async function analyzeWithHeuristics(dataUrl: string): Promise<{ proposedCount: number; regions: BoundingBox[] }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Work with a smaller version for speed
      const maxSize = 800;
      const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert to grayscale and detect edges
      const gray = new Uint8Array(canvas.width * canvas.height);
      const edges = new Uint8Array(canvas.width * canvas.height);

      // Grayscale conversion
      for (let i = 0; i < data.length; i += 4) {
        gray[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      }

      // Simple Sobel edge detection
      const width = canvas.width;
      const height = canvas.height;

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;

          // Sobel kernels
          const gx =
            -gray[(y - 1) * width + (x - 1)] + gray[(y - 1) * width + (x + 1)] +
            -2 * gray[y * width + (x - 1)] + 2 * gray[y * width + (x + 1)] +
            -gray[(y + 1) * width + (x - 1)] + gray[(y + 1) * width + (x + 1)];

          const gy =
            -gray[(y - 1) * width + (x - 1)] - 2 * gray[(y - 1) * width + x] - gray[(y - 1) * width + (x + 1)] +
            gray[(y + 1) * width + (x - 1)] + 2 * gray[(y + 1) * width + x] + gray[(y + 1) * width + (x + 1)];

          const magnitude = Math.sqrt(gx * gx + gy * gy);
          edges[idx] = magnitude > config.config.heuristics_engine.parameters.canny_threshold_1 ? 255 : 0;
        }
      }

      // Count horizontal and vertical edge segments
      let horizontalLines = 0;
      let verticalLines = 0;
      const minLineLength = config.config.heuristics_engine.parameters.hough_min_line_length;

      // Scan for horizontal lines
      for (let y = 0; y < height; y += Math.floor(height / 20)) {
        let consecutiveEdges = 0;
        for (let x = 0; x < width; x++) {
          if (edges[y * width + x] > 0) {
            consecutiveEdges++;
          } else {
            if (consecutiveEdges > minLineLength * scale) {
              horizontalLines++;
            }
            consecutiveEdges = 0;
          }
        }
      }

      // Scan for vertical lines
      for (let x = 0; x < width; x += Math.floor(width / 20)) {
        let consecutiveEdges = 0;
        for (let y = 0; y < height; y++) {
          if (edges[y * width + x] > 0) {
            consecutiveEdges++;
          } else {
            if (consecutiveEdges > minLineLength * scale) {
              verticalLines++;
            }
            consecutiveEdges = 0;
          }
        }
      }

      // Estimate photo count based on grid lines
      // Assumption: photos are arranged in a grid pattern
      const estimatedRows = Math.max(1, Math.floor(horizontalLines / 4));
      const estimatedCols = Math.max(1, Math.floor(verticalLines / 4));
      const proposedCount = Math.min(20, Math.max(1, estimatedRows * estimatedCols));

      // Generate rough bounding box proposals
      const regions: BoundingBox[] = [];
      const cellWidth = 1 / estimatedCols;
      const cellHeight = 1 / estimatedRows;

      for (let row = 0; row < estimatedRows; row++) {
        for (let col = 0; col < estimatedCols; col++) {
          regions.push({
            x: col * cellWidth + cellWidth * 0.05,
            y: row * cellHeight + cellHeight * 0.05,
            width: cellWidth * 0.9,
            height: cellHeight * 0.9,
            confidence: 0.5,
            label: 'heuristic_proposal'
          });
        }
      }

      tissaiaLogger.info('STAGE_1', `Edge analysis complete. H-lines: ${horizontalLines}, V-lines: ${verticalLines}`);

      resolve({ proposedCount, regions });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Main Stage 1 entry point - Process a raw scan file
 */
export async function processIngestion(file: File): Promise<ScanFile> {
  const scanId = crypto.randomUUID();

  tissaiaLogger.info('STAGE_1', `Loading 1 raw scans...`);

  const startTime = Date.now();

  // Validate file type
  if (!PIPELINE_CONFIG.pipeline_configuration.global_constraints.supported_mime_types.includes(file.type as any)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  // Validate file size
  const maxSizeMB = PIPELINE_CONFIG.pipeline_configuration.global_constraints.max_input_file_size_mb;
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`File too large. Maximum: ${maxSizeMB}MB`);
  }

  tissaiaLogger.info('STAGE_1', `Scan ${file.name} buffered.`);

  // Load image
  const { dataUrl, width, height } = await loadImageAsDataUrl(file);

  tissaiaLogger.info('STAGE_1', `[${file.name}] Running Ingestion & Heuristics (Edge/Hough)...`);

  // Generate thumbnail
  const thumbnailData = await generateThumbnail(
    dataUrl,
    config.config.thumbnail_generation.max_width,
    config.config.thumbnail_generation.quality
  );

  // Run heuristic analysis
  const { proposedCount } = await analyzeWithHeuristics(dataUrl);

  tissaiaLogger.info('STAGE_1', `[${file.name}] Auto-Detect Proposal: ${proposedCount}. Waiting for Operator Validation.`);

  const scanFile: ScanFile = {
    id: scanId,
    filename: file.name,
    originalFile: file,
    thumbnailData,
    lifecycleState: 'SCANNED',
    heuristicProposal: proposedCount,
    shards: [],
    metrics: {
      originalResolution: `${width}x${height}`,
      processingStartTime: startTime
    }
  };

  return scanFile;
}

/**
 * Confirm operator count and prepare for Stage 2
 */
export function commitOperatorCount(scan: ScanFile, count: number, autoRestore: boolean): ScanFile {
  tissaiaLogger.success('MANIFEST', `Operator committed count: ${count} for ${scan.id} [AutoRestore: ${autoRestore ? 'ENABLED' : 'DISABLED'}].`);

  return {
    ...scan,
    operatorCommittedCount: count,
    lifecycleState: 'CROPPING'
  };
}

export default {
  processIngestion,
  commitOperatorCount
};
