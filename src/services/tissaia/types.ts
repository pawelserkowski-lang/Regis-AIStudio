// ==========================================
// Tissaia - Forensic Restoration Engine
// Type Definitions v2.0
// ==========================================

export type MimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic';
export type ModelName = 'gemini-2.0-flash-preview-image-generation' | 'gemini-2.0-flash';
export type ScanLifecycleState = 'UPLOADING' | 'SCANNED' | 'CROPPING' | 'RESTORING' | 'DONE' | 'ERROR';

// --- Shared Configurations ---

export interface ModelConfig {
  model_name: ModelName;
  temperature: number;
  top_k?: number;
  max_output_tokens?: number;
  safety_settings?: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE';
}

export interface UiFeedback {
  loading_message?: string;
  success_message?: string;
  loading_states?: string[];
}

// --- Stage 1: Ingestion (Local Heuristics) ---

export interface HeuristicsEngine {
  method: 'Analiza Krawędzi i Transformata Hougha';
  library: 'OpenCV.js (WASM)';
  parameters: {
    gaussian_blur_kernel: number;
    canny_threshold_1: number;
    canny_threshold_2: number;
    hough_min_line_length: number;
    hough_max_line_gap: number;
  };
}

export interface StageIngestionConfig {
  name: string;
  description: string;
  timeout_ms: number;
  config: {
    heuristics_engine: HeuristicsEngine;
    thumbnail_generation: {
      max_width: number;
      quality: number;
      format: MimeType;
    };
  };
  ui_feedback: UiFeedback;
}

// --- Stage 2: Detection (Vision AI) ---

export interface DetectionPromptEngineering {
  system_role: string;
  task_directive: string;
  output_format_enforcement: string;
  strategy_fallback: string;
}

export interface StageDetectionConfig {
  name: string;
  description: string;
  service_endpoint: string;
  model_config: ModelConfig;
  prompt_engineering: DetectionPromptEngineering;
  error_handling: {
    retry_count: number;
    fallback_action: 'SWITCH_TO_MANUAL_CROP_UI' | 'ABORT';
  };
}

// --- Stage 3: Smart Crop (Client-Side) ---

export interface HygieneCutRule {
  enabled: boolean;
  margin_percentage: number;
  reason: string;
}

export interface StageSmartCropConfig {
  name: string;
  description: string;
  execution_context: 'Browser Main Thread' | 'WebWorker';
  logic_rules: {
    coordinate_mapping: string;
    hygiene_cut: HygieneCutRule;
    rotation_handling: {
      auto_rotate: boolean;
      background_fill: string;
    };
    output_format: {
      mime: MimeType;
      quality: number;
      encoding: 'base64';
    };
  };
}

// --- Stage 4: Alchemy (Restoration AI) ---

export interface PromptStep {
  id: 'OUTPAINTING' | 'HYGIENE' | 'DETAIL' | 'COLOR_GRADING';
  instruction: string;
  weight?: string;
  negative_prompt?: string;
  constraint?: string;
  reference?: string;
}

export interface StageAlchemyConfig {
  name: string;
  description: string;
  service_endpoint: string;
  cost_estimation: string;
  model_config: ModelConfig;
  prompt_directives: {
    structure: {
      role: string;
      input_context: string;
      steps: PromptStep[];
    };
  };
  ui_feedback: UiFeedback;
}

// --- ROOT PIPELINE CONFIGURATION ---

export interface PipelineStages {
  STAGE_1_INGESTION: StageIngestionConfig;
  STAGE_2_DETECTION: StageDetectionConfig;
  STAGE_3_SMART_CROP: StageSmartCropConfig;
  STAGE_4_ALCHEMY: StageAlchemyConfig;
}

export interface GlobalConstraints {
  max_concurrent_restorations: number;
  max_input_file_size_mb: number;
  supported_mime_types: MimeType[];
  security_sanitization: boolean;
}

export interface DataContractScanFile {
  id: string;
  lifecycle_state: ScanLifecycleState;
  metrics: {
    original_resolution: string;
    processing_time_ms: number;
  };
}

export interface PipelineConfiguration {
  pipeline_configuration: {
    meta: {
      id: string;
      revision: string;
      last_updated: string;
      environment: 'production' | 'development' | 'staging';
    };
    global_constraints: GlobalConstraints;
    stages: PipelineStages;
    data_contracts: {
      ScanFile: DataContractScanFile;
    };
  };
}

// --- Runtime Types ---

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
  label?: string;
}

export interface CutMap {
  scanId: string;
  filename: string;
  originalWidth: number;
  originalHeight: number;
  detectedObjects: BoundingBox[];
  generatedAt: number;
  method: 'AI_DETECTION' | 'HEURISTIC_FALLBACK' | 'MANUAL';
}

export interface Shard {
  id: string;
  scanId: string;
  index: number;
  boundingBox: BoundingBox;
  croppedImageData?: string; // base64
  restoredImageData?: string; // base64
  status: 'PENDING' | 'CROPPING' | 'CROPPED' | 'RESTORING' | 'RESTORED' | 'ERROR';
  error?: string;
}

export interface ScanFile {
  id: string;
  filename: string;
  originalFile: File;
  thumbnailData?: string;
  lifecycleState: ScanLifecycleState;
  heuristicProposal?: number;
  operatorCommittedCount?: number;
  cutMap?: CutMap;
  shards: Shard[];
  metrics: {
    originalResolution: string;
    processingStartTime?: number;
    processingEndTime?: number;
  };
  error?: string;
}

export interface PipelineSession {
  id: string;
  startedAt: number;
  scans: ScanFile[];
  autoRestoreEnabled: boolean;
  status: 'IDLE' | 'PROCESSING' | 'PAUSED' | 'COMPLETED' | 'ERROR';
}

// --- Logger Types ---

export type LogLevel = 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
export type LogModule = 'KERNEL' | 'STAGE_1' | 'STAGE_2' | 'STAGE_3' | 'STAGE_4' | 'MANIFEST' | 'CHAT' | 'POST';

export interface TissaiaLogEntry {
  timestamp: Date;
  level: LogLevel;
  module: LogModule;
  message: string;
  data?: any;
}
