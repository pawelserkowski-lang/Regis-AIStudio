// ==========================================
// Tissaia - Stage 3: Smart Crop
// ==========================================

import { ScanFile, Shard, BoundingBox } from './types';
import { PIPELINE_CONFIG } from './config';
import tissaiaLogger from './logger';

const config = PIPELINE_CONFIG.pipeline_configuration.stages.STAGE_3_SMART_CROP;

/**
 * Load image from File object
 */
async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Apply hygiene margin to bounding box
 * Expands the box slightly to ensure clean edges
 */
function applyHygieneMargin(box: BoundingBox, marginPercent: number): BoundingBox {
  const margin = marginPercent;

  return {
    x: Math.max(0, box.x - margin),
    y: Math.max(0, box.y - margin),
    width: Math.min(1 - (box.x - margin), box.width + margin * 2),
    height: Math.min(1 - (box.y - margin), box.height + margin * 2),
    confidence: box.confidence,
    label: box.label
  };
}

/**
 * Crop a single region from the source image
 */
async function cropRegion(
  sourceImage: HTMLImageElement,
  box: BoundingBox,
  applyHygiene: boolean = true
): Promise<string> {
  // Apply hygiene margin if enabled
  const finalBox = applyHygiene && config.logic_rules.hygiene_cut.enabled
    ? applyHygieneMargin(box, config.logic_rules.hygiene_cut.margin_percentage)
    : box;

  // Convert normalized coordinates to pixels
  const x = Math.round(finalBox.x * sourceImage.naturalWidth);
  const y = Math.round(finalBox.y * sourceImage.naturalHeight);
  const width = Math.round(finalBox.width * sourceImage.naturalWidth);
  const height = Math.round(finalBox.height * sourceImage.naturalHeight);

  // Ensure valid dimensions
  const safeX = Math.max(0, Math.min(x, sourceImage.naturalWidth - 1));
  const safeY = Math.max(0, Math.min(y, sourceImage.naturalHeight - 1));
  const safeWidth = Math.max(1, Math.min(width, sourceImage.naturalWidth - safeX));
  const safeHeight = Math.max(1, Math.min(height, sourceImage.naturalHeight - safeY));

  // Create canvas for cropping
  const canvas = document.createElement('canvas');
  canvas.width = safeWidth;
  canvas.height = safeHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Fill with background color (for rotation handling)
  ctx.fillStyle = config.logic_rules.rotation_handling.background_fill;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the cropped region
  ctx.drawImage(
    sourceImage,
    safeX, safeY, safeWidth, safeHeight,  // Source rectangle
    0, 0, safeWidth, safeHeight            // Destination rectangle
  );

  // Export as base64
  return canvas.toDataURL(
    config.logic_rules.output_format.mime,
    config.logic_rules.output_format.quality
  );
}

/**
 * Process a single shard (crop one detected object)
 */
async function processShard(
  sourceImage: HTMLImageElement,
  box: BoundingBox,
  scanId: string,
  index: number,
  totalCount: number
): Promise<Shard> {
  const shardId = `${scanId}-shard-${index}`;

  tissaiaLogger.info('STAGE_3', `Processing Shard ${index + 1}/${totalCount} [Smart Crop]...`);

  try {
    const croppedImageData = await cropRegion(sourceImage, box, true);

    return {
      id: shardId,
      scanId,
      index,
      boundingBox: box,
      croppedImageData,
      status: 'CROPPED'
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    tissaiaLogger.error('STAGE_3', `Failed to crop shard ${index + 1}: ${errorMsg}`);

    return {
      id: shardId,
      scanId,
      index,
      boundingBox: box,
      status: 'ERROR',
      error: errorMsg
    };
  }
}

/**
 * Main Stage 3 entry point - Smart Crop all detected objects
 */
export async function processSmartCrop(scan: ScanFile): Promise<ScanFile> {
  if (!scan.cutMap) {
    tissaiaLogger.error('STAGE_3', 'No cut map available - cannot proceed with cropping');
    return {
      ...scan,
      lifecycleState: 'ERROR',
      error: 'No cut map available'
    };
  }

  const cutMap = scan.cutMap;
  const totalShards = cutMap.detectedObjects.length;

  if (totalShards === 0) {
    tissaiaLogger.warn('STAGE_3', 'Cut map has no detected objects');
    return {
      ...scan,
      shards: [],
      lifecycleState: 'DONE'
    };
  }

  tissaiaLogger.info('STAGE_3', `Starting Smart Crop for ${scan.filename}. ${totalShards} shards to process.`);

  try {
    // Load the source image
    const sourceImage = await loadImage(scan.originalFile);

    // Process all shards
    const shards: Shard[] = [];
    const concurrency = PIPELINE_CONFIG.pipeline_configuration.global_constraints.max_concurrent_restorations;

    // Process in batches for better performance
    for (let i = 0; i < totalShards; i += concurrency) {
      const batch = cutMap.detectedObjects.slice(i, i + concurrency);
      const batchPromises = batch.map((box, batchIndex) =>
        processShard(sourceImage, box, scan.id, i + batchIndex, totalShards)
      );

      const batchResults = await Promise.all(batchPromises);
      shards.push(...batchResults);
    }

    // Check for errors
    const successCount = shards.filter(s => s.status === 'CROPPED').length;
    const errorCount = shards.filter(s => s.status === 'ERROR').length;

    if (errorCount > 0) {
      tissaiaLogger.warn('STAGE_3', `Completed with ${errorCount} errors out of ${totalShards} shards`);
    } else {
      tissaiaLogger.success('STAGE_3', `All ${successCount} shards cropped successfully`);
    }

    return {
      ...scan,
      shards,
      lifecycleState: 'RESTORING'
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    tissaiaLogger.error('STAGE_3', `Smart Crop failed: ${errorMsg}`);

    return {
      ...scan,
      lifecycleState: 'ERROR',
      error: errorMsg
    };
  }
}

/**
 * Get cropped image as Blob for download
 */
export async function getShardAsBlob(shard: Shard): Promise<Blob | null> {
  if (!shard.croppedImageData) {
    return null;
  }

  const response = await fetch(shard.croppedImageData);
  return response.blob();
}

/**
 * Download a single shard
 */
export async function downloadShard(shard: Shard, filename?: string): Promise<void> {
  const blob = await getShardAsBlob(shard);
  if (!blob) {
    throw new Error('No cropped image data available');
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `shard_${shard.index + 1}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default {
  processSmartCrop,
  getShardAsBlob,
  downloadShard
};
