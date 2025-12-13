// ==========================================
// Tissaia - Forensic Restoration Engine
// Main Export
// ==========================================

// Types
export * from './types';

// Configuration
export { PIPELINE_CONFIG } from './config';

// Logger
export { tissaiaLogger } from './logger';

// Stages
export { processIngestion, commitOperatorCount } from './stage1-ingestion';
export { processDetection, visualizeCutMap } from './stage2-detection';
export { processSmartCrop, getShardAsBlob, downloadShard } from './stage3-smartcrop';
export { processAlchemy, downloadRestoredShard, downloadAllRestored } from './stage4-alchemy';

// Pipeline Orchestrator
export { tissaiaPipeline } from './pipeline';
export type { PipelineEvent, PipelineEventType } from './pipeline';

// Default export is the pipeline
import { tissaiaPipeline } from './pipeline';
export default tissaiaPipeline;
