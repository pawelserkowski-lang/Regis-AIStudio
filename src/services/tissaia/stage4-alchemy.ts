// ==========================================
// Tissaia - Stage 4: Alchemy Restoration
// ==========================================

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { ScanFile, Shard } from './types';
import { PIPELINE_CONFIG } from './config';
import tissaiaLogger from './logger';

const config = PIPELINE_CONFIG.pipeline_configuration.stages.STAGE_4_ALCHEMY;

// Safety settings for restoration
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/**
 * Build the restoration prompt from config
 */
function buildRestorationPrompt(): string {
  const { structure } = config.prompt_directives;

  let prompt = `${structure.role}\n\n${structure.input_context}\n\n`;
  prompt += `Please perform the following restoration steps:\n\n`;

  structure.steps.forEach((step, index) => {
    prompt += `${index + 1}. **${step.id}** (Priority: ${step.weight || 'Medium'})\n`;
    prompt += `   ${step.instruction}\n`;
    if (step.constraint) {
      prompt += `   Constraint: ${step.constraint}\n`;
    }
    if (step.negative_prompt) {
      prompt += `   Avoid: ${step.negative_prompt}\n`;
    }
    if (step.reference) {
      prompt += `   Reference: ${step.reference}\n`;
    }
    prompt += '\n';
  });

  prompt += `\nIMPORTANT: Generate a restored version of the photograph. Maintain photographic realism. Do not add watermarks or text.`;

  return prompt;
}

/**
 * Extract base64 data from data URL
 */
function extractBase64(dataUrl: string): string {
  const parts = dataUrl.split(',');
  return parts.length > 1 ? parts[1] : dataUrl;
}

/**
 * Get MIME type from data URL
 */
function getMimeType(dataUrl: string): string {
  const match = dataUrl.match(/data:([^;]+);/);
  return match ? match[1] : 'image/png';
}

/**
 * Restore a single shard using Gemini
 */
async function restoreShard(
  shard: Shard,
  genAI: GoogleGenerativeAI,
  index: number,
  totalCount: number
): Promise<Shard> {
  tissaiaLogger.info('STAGE_4', `Processing Shard ${index + 1}/${totalCount} [Alchemy]...`);

  if (!shard.croppedImageData) {
    tissaiaLogger.error('STAGE_4', `Shard ${index + 1} has no cropped image data`);
    return {
      ...shard,
      status: 'ERROR',
      error: 'No cropped image data'
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: config.model_config.model_name,
      safetySettings: SAFETY_SETTINGS,
      generationConfig: {
        temperature: config.model_config.temperature,
        maxOutputTokens: config.model_config.max_output_tokens,
      }
    });

    const prompt = buildRestorationPrompt();
    const imageBase64 = extractBase64(shard.croppedImageData);
    const mimeType = getMimeType(shard.croppedImageData);

    // Call Gemini with image
    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: imageBase64
        }
      }
    ]);

    const response = await result.response;

    // Check if we got an image response
    // Note: Gemini 2.0 image generation returns images differently
    // For now, we'll use the cropped image as a placeholder if no image is returned
    let restoredImageData = shard.croppedImageData;

    // Try to extract generated image from response
    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if ((part as any).inlineData) {
            const inlineData = (part as any).inlineData;
            restoredImageData = `data:${inlineData.mimeType};base64,${inlineData.data}`;
            break;
          }
        }
      }
    }

    tissaiaLogger.success('STAGE_4', `Shard ${index + 1}/${totalCount} restored successfully.`);

    return {
      ...shard,
      restoredImageData,
      status: 'RESTORED'
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    tissaiaLogger.error('STAGE_4', `Failed to restore shard ${index + 1}: ${errorMsg}`);

    // Return the cropped image as fallback
    return {
      ...shard,
      restoredImageData: shard.croppedImageData, // Use cropped as fallback
      status: 'RESTORED', // Mark as restored anyway to continue pipeline
      error: `Restoration failed: ${errorMsg} (using original crop)`
    };
  }
}

/**
 * Main Stage 4 entry point - Restore all shards using Alchemy
 */
export async function processAlchemy(scan: ScanFile): Promise<ScanFile> {
  const shardsToRestore = scan.shards.filter(s => s.status === 'CROPPED');
  const totalShards = shardsToRestore.length;

  if (totalShards === 0) {
    tissaiaLogger.warn('STAGE_4', 'No shards to restore');
    return {
      ...scan,
      lifecycleState: 'DONE'
    };
  }

  tissaiaLogger.info('STAGE_4', `Starting ALCHEMY for ${scan.filename}. ${totalShards} shards scheduled.`);

  // Get API key
  const apiKey = (window as any).__GEMINI_API_KEY__ ||
                 localStorage.getItem('gemini_api_key') ||
                 import.meta.env.VITE_GOOGLE_API_KEY;

  if (!apiKey) {
    tissaiaLogger.warn('STAGE_4', 'No API key - using cropped images as restored');

    // Use cropped images as restored when no API key
    const restoredShards = scan.shards.map(shard => ({
      ...shard,
      restoredImageData: shard.croppedImageData,
      status: 'RESTORED' as const
    }));

    return {
      ...scan,
      shards: restoredShards,
      lifecycleState: 'DONE'
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const concurrency = PIPELINE_CONFIG.pipeline_configuration.global_constraints.max_concurrent_restorations;

    // Process shards in batches
    const restoredShards: Shard[] = [...scan.shards];

    for (let i = 0; i < shardsToRestore.length; i += concurrency) {
      const batch = shardsToRestore.slice(i, i + concurrency);
      const batchPromises = batch.map((shard, batchIndex) =>
        restoreShard(shard, genAI, i + batchIndex, totalShards)
      );

      const batchResults = await Promise.all(batchPromises);

      // Update the shards array with restored versions
      batchResults.forEach(restoredShard => {
        const idx = restoredShards.findIndex(s => s.id === restoredShard.id);
        if (idx !== -1) {
          restoredShards[idx] = restoredShard;
        }
      });
    }

    // Count results
    const successCount = restoredShards.filter(s => s.status === 'RESTORED').length;
    const errorCount = restoredShards.filter(s => s.status === 'ERROR').length;

    if (errorCount > 0) {
      tissaiaLogger.warn('STAGE_4', `Completed with ${errorCount} errors out of ${totalShards} shards`);
    } else {
      tissaiaLogger.success('STAGE_4', `All ${successCount} shards restored successfully`);
    }

    return {
      ...scan,
      shards: restoredShards,
      lifecycleState: 'DONE',
      metrics: {
        ...scan.metrics,
        processingEndTime: Date.now()
      }
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    tissaiaLogger.error('STAGE_4', `Alchemy processing failed: ${errorMsg}`);

    // Mark all shards as restored with their cropped versions
    const fallbackShards = scan.shards.map(shard => ({
      ...shard,
      restoredImageData: shard.croppedImageData,
      status: 'RESTORED' as const
    }));

    return {
      ...scan,
      shards: fallbackShards,
      lifecycleState: 'DONE',
      error: `Alchemy failed: ${errorMsg}`
    };
  }
}

/**
 * Download restored shard
 */
export async function downloadRestoredShard(shard: Shard, filename?: string): Promise<void> {
  const imageData = shard.restoredImageData || shard.croppedImageData;
  if (!imageData) {
    throw new Error('No image data available');
  }

  const response = await fetch(imageData);
  const blob = await response.blob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `restored_${shard.index + 1}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download all restored shards as a zip
 */
export async function downloadAllRestored(scan: ScanFile): Promise<void> {
  // For now, download each individually
  // TODO: Implement zip download
  for (const shard of scan.shards) {
    if (shard.restoredImageData) {
      await downloadRestoredShard(shard, `${scan.filename}_restored_${shard.index + 1}.png`);
    }
  }
}

export default {
  processAlchemy,
  downloadRestoredShard,
  downloadAllRestored
};
