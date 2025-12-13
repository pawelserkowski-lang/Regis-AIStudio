// ==========================================
// Tissaia - Pipeline Orchestrator
// ==========================================

import { ScanFile, PipelineSession, CutMap } from './types';
import { processIngestion, commitOperatorCount } from './stage1-ingestion';
import { processDetection, visualizeCutMap } from './stage2-detection';
import { processSmartCrop } from './stage3-smartcrop';
import { processAlchemy } from './stage4-alchemy';
import tissaiaLogger from './logger';

export type PipelineEventType =
  | 'session_started'
  | 'scan_added'
  | 'scan_ingested'
  | 'operator_committed'
  | 'detection_complete'
  | 'cutmap_generated'
  | 'crop_complete'
  | 'alchemy_complete'
  | 'scan_complete'
  | 'session_complete'
  | 'error';

export interface PipelineEvent {
  type: PipelineEventType;
  scan?: ScanFile;
  session?: PipelineSession;
  cutMap?: CutMap;
  error?: string;
}

type PipelineEventCallback = (event: PipelineEvent) => void;

class TissaiaPipeline {
  private currentSession: PipelineSession | null = null;
  private eventListeners: PipelineEventCallback[] = [];

  constructor() {
    tissaiaLogger.info('KERNEL', 'System EPS Architect Engine zainicjowany.');
  }

  /**
   * Subscribe to pipeline events
   */
  on(callback: PipelineEventCallback): () => void {
    this.eventListeners.push(callback);
    return () => {
      this.eventListeners = this.eventListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Emit pipeline event
   */
  private emit(event: PipelineEvent): void {
    this.eventListeners.forEach(callback => {
      try {
        callback(event);
      } catch (e) {
        console.error('Pipeline event handler error:', e);
      }
    });
  }

  /**
   * Start a new pipeline session
   */
  startSession(autoRestore: boolean = false): PipelineSession {
    const session: PipelineSession = {
      id: crypto.randomUUID(),
      startedAt: Date.now(),
      scans: [],
      autoRestoreEnabled: autoRestore,
      status: 'IDLE'
    };

    this.currentSession = session;
    tissaiaLogger.info('KERNEL', `Session resumed. Started at ${new Date(session.startedAt).toISOString()}`);

    this.emit({ type: 'session_started', session });
    return session;
  }

  /**
   * Get current session
   */
  getSession(): PipelineSession | null {
    return this.currentSession;
  }

  /**
   * Add a scan file and process through Stage 1
   */
  async addScan(file: File): Promise<ScanFile> {
    if (!this.currentSession) {
      this.startSession();
    }

    this.currentSession!.status = 'PROCESSING';

    try {
      // Stage 1: Ingestion
      const scan = await processIngestion(file);

      this.currentSession!.scans.push(scan);
      this.emit({ type: 'scan_added', scan, session: this.currentSession! });
      this.emit({ type: 'scan_ingested', scan, session: this.currentSession! });

      return scan;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      tissaiaLogger.error('KERNEL', `Failed to add scan: ${errorMsg}`);
      this.emit({ type: 'error', error: errorMsg });
      throw error;
    }
  }

  /**
   * Operator commits the count and triggers Stage 2
   */
  async commitCount(scanId: string, count: number, autoRestore: boolean = false): Promise<ScanFile> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const scanIndex = this.currentSession.scans.findIndex(s => s.id === scanId);
    if (scanIndex === -1) {
      throw new Error('Scan not found');
    }

    let scan = this.currentSession.scans[scanIndex];

    // Commit operator count
    scan = commitOperatorCount(scan, count, autoRestore);
    this.currentSession.scans[scanIndex] = scan;
    this.emit({ type: 'operator_committed', scan, session: this.currentSession });

    // Stage 2: Detection
    const { scan: detectedScan, cutMap } = await processDetection(scan);
    scan = detectedScan;
    this.currentSession.scans[scanIndex] = scan;

    this.emit({ type: 'detection_complete', scan, cutMap, session: this.currentSession });
    this.emit({ type: 'cutmap_generated', scan, cutMap, session: this.currentSession });

    // If autoRestore is enabled, continue to Stage 3 & 4
    if (autoRestore) {
      scan = await this.processCropAndRestore(scan);
      this.currentSession.scans[scanIndex] = scan;
    }

    return scan;
  }

  /**
   * Process Stage 3 (Smart Crop) and Stage 4 (Alchemy)
   */
  async processCropAndRestore(scan: ScanFile): Promise<ScanFile> {
    // Stage 3: Smart Crop
    let processedScan = await processSmartCrop(scan);
    this.emit({ type: 'crop_complete', scan: processedScan, session: this.currentSession! });

    // Stage 4: Alchemy Restoration
    processedScan = await processAlchemy(processedScan);
    this.emit({ type: 'alchemy_complete', scan: processedScan, session: this.currentSession! });

    // Finalization
    tissaiaLogger.success('POST', `Finalization complete for: ${scan.filename}. All shards valid.`);
    this.emit({ type: 'scan_complete', scan: processedScan, session: this.currentSession! });

    // Update session
    if (this.currentSession) {
      const scanIndex = this.currentSession.scans.findIndex(s => s.id === scan.id);
      if (scanIndex !== -1) {
        this.currentSession.scans[scanIndex] = processedScan;
      }

      // Check if all scans are done
      const allDone = this.currentSession.scans.every(s => s.lifecycleState === 'DONE');
      if (allDone) {
        this.currentSession.status = 'COMPLETED';
        this.emit({ type: 'session_complete', session: this.currentSession });
      }
    }

    return processedScan;
  }

  /**
   * Process a scan that has a cut map (Stage 3 & 4)
   */
  async processWithCutMap(scanId: string): Promise<ScanFile> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const scanIndex = this.currentSession.scans.findIndex(s => s.id === scanId);
    if (scanIndex === -1) {
      throw new Error('Scan not found');
    }

    const scan = this.currentSession.scans[scanIndex];

    if (!scan.cutMap) {
      throw new Error('Scan has no cut map');
    }

    const processedScan = await this.processCropAndRestore(scan);
    this.currentSession.scans[scanIndex] = processedScan;

    return processedScan;
  }

  /**
   * Full pipeline: Add scan, commit count, and process all stages
   */
  async processFullPipeline(file: File, count?: number): Promise<ScanFile> {
    // Stage 1: Ingestion
    let scan = await this.addScan(file);

    // Use heuristic proposal if no count provided
    const finalCount = count ?? scan.heuristicProposal ?? 1;

    // Stage 2: Detection (with auto-restore enabled)
    scan = await this.commitCount(scan.id, finalCount, true);

    return scan;
  }

  /**
   * Visualize cut map on a canvas element
   */
  async visualizeCutMapOnCanvas(
    scanId: string,
    canvas: HTMLCanvasElement
  ): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const scan = this.currentSession.scans.find(s => s.id === scanId);
    if (!scan || !scan.cutMap) {
      throw new Error('Scan or cut map not found');
    }

    // Create object URL for the original file
    const imageUrl = URL.createObjectURL(scan.originalFile);

    try {
      await visualizeCutMap(canvas, imageUrl, scan.cutMap);
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    this.currentSession = null;
    tissaiaLogger.info('KERNEL', 'Session cleared');
  }

  /**
   * Get session statistics
   */
  getStats(): {
    totalScans: number;
    completedScans: number;
    totalShards: number;
    restoredShards: number;
    processingTime?: number;
  } {
    if (!this.currentSession) {
      return {
        totalScans: 0,
        completedScans: 0,
        totalShards: 0,
        restoredShards: 0
      };
    }

    const totalScans = this.currentSession.scans.length;
    const completedScans = this.currentSession.scans.filter(s => s.lifecycleState === 'DONE').length;
    const totalShards = this.currentSession.scans.reduce((sum, s) => sum + s.shards.length, 0);
    const restoredShards = this.currentSession.scans.reduce(
      (sum, s) => sum + s.shards.filter(sh => sh.status === 'RESTORED').length,
      0
    );

    // Calculate processing time
    const startTimes = this.currentSession.scans
      .map(s => s.metrics.processingStartTime)
      .filter(Boolean) as number[];
    const endTimes = this.currentSession.scans
      .map(s => s.metrics.processingEndTime)
      .filter(Boolean) as number[];

    let processingTime: number | undefined;
    if (startTimes.length > 0 && endTimes.length > 0) {
      processingTime = Math.max(...endTimes) - Math.min(...startTimes);
    }

    return {
      totalScans,
      completedScans,
      totalShards,
      restoredShards,
      processingTime
    };
  }
}

// Singleton instance
export const tissaiaPipeline = new TissaiaPipeline();
export default tissaiaPipeline;
