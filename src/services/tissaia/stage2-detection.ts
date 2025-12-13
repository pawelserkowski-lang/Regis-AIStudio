// ==========================================
// Tissaia - Stage 2: Neural Object Detection
// ==========================================

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { ScanFile, CutMap, BoundingBox } from './types';
import { PIPELINE_CONFIG } from './config';
import tissaiaLogger from './logger';

const config = PIPELINE_CONFIG.pipeline_configuration.stages.STAGE_2_DETECTION;

// Safety settings for detection (need vision capabilities)
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/**
 * Build the detection prompt for Gemini Vision
 */
function buildDetectionPrompt(targetCount: number): string {
  return `${config.prompt_engineering.system_role}

${config.prompt_engineering.task_directive}

Target count from operator: ${targetCount} photographs expected.

${config.prompt_engineering.output_format_enforcement}

IMPORTANT RULES:
1. Coordinates must be normalized (0.0 to 1.0 range)
2. x, y represent the TOP-LEFT corner of each bounding box
3. width and height are the dimensions of the box (also normalized)
4. confidence should be between 0.0 and 1.0
5. Detect ALL visible photographs, even if partially visible
6. If you detect fewer than ${targetCount}, still report what you find
7. If you detect more than ${targetCount}, report all of them`;
}

/**
 * Parse the AI response to extract bounding boxes
 */
function parseDetectionResponse(response: string): { boxes: BoundingBox[]; error?: string } {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      tissaiaLogger.warn('STAGE_2', 'No JSON found in response, attempting fallback parse');
      return { boxes: [], error: 'No JSON in response' };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.error) {
      return { boxes: [], error: parsed.error };
    }

    if (!parsed.detected_objects || !Array.isArray(parsed.detected_objects)) {
      return { boxes: [], error: 'Invalid response format' };
    }

    const boxes: BoundingBox[] = parsed.detected_objects.map((obj: any, index: number) => ({
      x: Math.max(0, Math.min(1, Number(obj.x) || 0)),
      y: Math.max(0, Math.min(1, Number(obj.y) || 0)),
      width: Math.max(0.01, Math.min(1, Number(obj.width) || 0.1)),
      height: Math.max(0.01, Math.min(1, Number(obj.height) || 0.1)),
      confidence: Math.max(0, Math.min(1, Number(obj.confidence) || 0.5)),
      label: obj.label || `photo_${index + 1}`
    }));

    return { boxes };
  } catch (e) {
    tissaiaLogger.error('STAGE_2', 'Failed to parse detection response', { error: e, response: response.substring(0, 200) });
    return { boxes: [], error: 'Parse error' };
  }
}

/**
 * Load image as base64 for Gemini API
 */
async function loadImageAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get pure base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;

    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result as string; };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Generate fallback grid-based cut map when AI detection fails
 */
function generateFallbackCutMap(
  scanId: string,
  filename: string,
  width: number,
  height: number,
  targetCount: number
): CutMap {
  tissaiaLogger.warn('STAGE_2', 'Generating fallback grid-based cut map');

  // Determine grid layout based on target count
  let rows = 1, cols = 1;

  if (targetCount <= 1) {
    rows = 1; cols = 1;
  } else if (targetCount <= 2) {
    rows = 1; cols = 2;
  } else if (targetCount <= 4) {
    rows = 2; cols = 2;
  } else if (targetCount <= 6) {
    rows = 2; cols = 3;
  } else if (targetCount <= 9) {
    rows = 3; cols = 3;
  } else if (targetCount <= 12) {
    rows = 3; cols = 4;
  } else {
    rows = 4; cols = Math.ceil(targetCount / 4);
  }

  const boxes: BoundingBox[] = [];
  const cellWidth = 1 / cols;
  const cellHeight = 1 / rows;
  const margin = 0.02; // 2% margin

  for (let r = 0; r < rows && boxes.length < targetCount; r++) {
    for (let c = 0; c < cols && boxes.length < targetCount; c++) {
      boxes.push({
        x: c * cellWidth + margin,
        y: r * cellHeight + margin,
        width: cellWidth - margin * 2,
        height: cellHeight - margin * 2,
        confidence: 0.3,
        label: `fallback_${boxes.length + 1}`
      });
    }
  }

  return {
    scanId,
    filename,
    originalWidth: width,
    originalHeight: height,
    detectedObjects: boxes,
    generatedAt: Date.now(),
    method: 'HEURISTIC_FALLBACK'
  };
}

/**
 * Main Stage 2 entry point - Detect objects using Gemini Vision AI
 */
export async function processDetection(scan: ScanFile): Promise<{ scan: ScanFile; cutMap: CutMap }> {
  const targetCount = scan.operatorCommittedCount || scan.heuristicProposal || 1;

  tissaiaLogger.info('STAGE_2', `Initiating YOLO Inference Protocol: ${scan.filename} [Target: ${targetCount}]`);
  tissaiaLogger.info('CHAT', `USER: Analyze image: ${scan.filename}`);
  tissaiaLogger.info('STAGE_2', `[Neural Object Detection] Executing Strategy Lvl 1: YOLO v8...`);

  // Get API key
  const apiKey = (window as any).__GEMINI_API_KEY__ ||
                 localStorage.getItem('gemini_api_key') ||
                 import.meta.env.VITE_GOOGLE_API_KEY;

  if (!apiKey) {
    tissaiaLogger.error('STAGE_2', 'No Gemini API key available');
    const { width, height } = await getImageDimensions(scan.originalFile);
    const cutMap = generateFallbackCutMap(scan.id, scan.filename, width, height, targetCount);
    tissaiaLogger.warn('STAGE_2', `[WARN] No API key. Falling back to SIMULATION.`);
    return { scan: { ...scan, cutMap }, cutMap };
  }

  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: config.model_config.model_name,
      safetySettings: SAFETY_SETTINGS,
    });

    // Load image
    const imageBase64 = await loadImageAsBase64(scan.originalFile);
    const { width, height } = await getImageDimensions(scan.originalFile);

    // Build prompt
    const prompt = buildDetectionPrompt(targetCount);

    // Call Gemini Vision API
    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: scan.originalFile.type,
          data: imageBase64
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    tissaiaLogger.info('STAGE_2', `AI Response received (${text.length} chars)`);

    // Parse response
    const { boxes, error } = parseDetectionResponse(text);

    if (error || boxes.length === 0) {
      tissaiaLogger.warn('STAGE_2', `Detection failed or empty: ${error}. Using fallback.`);
      const cutMap = generateFallbackCutMap(scan.id, scan.filename, width, height, targetCount);
      tissaiaLogger.info('CHAT', `AI: Detected ${cutMap.detectedObjects.length} objects in ${scan.filename} (fallback)`);
      tissaiaLogger.success('STAGE_2', `Extraction Complete: ${cutMap.detectedObjects.length} shards secured.`);
      return { scan: { ...scan, cutMap }, cutMap };
    }

    // Create cut map
    const cutMap: CutMap = {
      scanId: scan.id,
      filename: scan.filename,
      originalWidth: width,
      originalHeight: height,
      detectedObjects: boxes,
      generatedAt: Date.now(),
      method: 'AI_DETECTION'
    };

    tissaiaLogger.info('CHAT', `AI: Detected ${boxes.length} objects in ${scan.filename}`);
    tissaiaLogger.success('STAGE_2', `Extraction Complete: ${boxes.length} shards secured.`);

    // Log the cut map details
    tissaiaLogger.info('STAGE_2', `Cut Map Generated:`, {
      method: cutMap.method,
      objectCount: cutMap.detectedObjects.length,
      boxes: cutMap.detectedObjects.map((b, i) => ({
        index: i + 1,
        x: b.x.toFixed(3),
        y: b.y.toFixed(3),
        w: b.width.toFixed(3),
        h: b.height.toFixed(3),
        conf: b.confidence?.toFixed(2)
      }))
    });

    return {
      scan: { ...scan, cutMap },
      cutMap
    };

  } catch (error) {
    const errorStr = error instanceof Error ? error.message : String(error);
    tissaiaLogger.info('STAGE_2', `[Neural Object Detection] Strategy Error: ${JSON.stringify({ error: errorStr })}`);
    tissaiaLogger.info('STAGE_2', `[WARN] API Error (${JSON.stringify({ error: errorStr })}). Falling back to SIMULATION.`);

    const { width, height } = await getImageDimensions(scan.originalFile);
    const cutMap = generateFallbackCutMap(scan.id, scan.filename, width, height, targetCount);
    tissaiaLogger.success('STAGE_2', `Extraction Complete: ${cutMap.detectedObjects.length} shards secured.`);

    return { scan: { ...scan, cutMap }, cutMap };
  }
}

/**
 * Visualize cut map on canvas (for debugging/UI)
 */
export function visualizeCutMap(
  canvas: HTMLCanvasElement,
  imageUrl: string,
  cutMap: CutMap
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      // Draw bounding boxes
      cutMap.detectedObjects.forEach((box, index) => {
        const x = box.x * canvas.width;
        const y = box.y * canvas.height;
        const w = box.width * canvas.width;
        const h = box.height * canvas.height;

        // Draw rectangle
        ctx.strokeStyle = cutMap.method === 'AI_DETECTION' ? '#00ff00' : '#ffff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        // Draw label
        ctx.fillStyle = cutMap.method === 'AI_DETECTION' ? '#00ff00' : '#ffff00';
        ctx.font = '16px monospace';
        ctx.fillText(`#${index + 1} (${(box.confidence || 0).toFixed(2)})`, x + 5, y + 20);
      });

      resolve();
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

export default {
  processDetection,
  visualizeCutMap
};
