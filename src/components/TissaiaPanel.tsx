// ==========================================
// Tissaia Panel - Forensic Restoration UI
// ==========================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Download, Check, Loader2, Image, Scissors, Sparkles, Grid3X3 } from 'lucide-react';
import { tissaiaPipeline, tissaiaLogger, ScanFile, PipelineEvent } from '../services/tissaia';
import { downloadRestoredShard } from '../services/tissaia/stage4-alchemy';

interface Props {
  lang: 'PL' | 'EN';
}

const TissaiaPanel: React.FC<Props> = ({ lang }) => {
  const [scans, setScans] = useState<ScanFile[]>([]);
  const [selectedScan, setSelectedScan] = useState<ScanFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(1);
  const [autoRestore, setAutoRestore] = useState(true);
  const [showCutMap, setShowCutMap] = useState(false);
  const [logs, setLogs] = useState<Array<{ time: string; level: string; module: string; msg: string }>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cutMapCanvasRef = useRef<HTMLCanvasElement>(null);

  const t = lang === 'PL' ? {
    title: 'Tissaia - Restauracja Forensyczna',
    subtitle: 'Wykrywanie i restauracja zdjęć z albumów',
    uploadBtn: 'Wgraj Skan',
    processBtn: 'Przetwórz',
    autoRestore: 'Auto-Restauracja',
    detectedPhotos: 'Wykryte zdjęcia:',
    confirm: 'Zatwierdź',
    stage1: 'Analiza',
    stage2: 'Detekcja',
    stage3: 'Kadrowanie',
    stage4: 'Restauracja',
    viewCutMap: 'Pokaż mapę cięć',
    download: 'Pobierz',
    noScans: 'Brak skanów. Wgraj plik aby rozpocząć.',
    processing: 'Przetwarzanie...',
    complete: 'Zakończono',
    shards: 'Fragmenty',
  } : {
    title: 'Tissaia - Forensic Restoration',
    subtitle: 'Photo detection and restoration from albums',
    uploadBtn: 'Upload Scan',
    processBtn: 'Process',
    autoRestore: 'Auto-Restore',
    detectedPhotos: 'Detected photos:',
    confirm: 'Confirm',
    stage1: 'Analysis',
    stage2: 'Detection',
    stage3: 'Cropping',
    stage4: 'Restoration',
    viewCutMap: 'Show Cut Map',
    download: 'Download',
    noScans: 'No scans. Upload a file to begin.',
    processing: 'Processing...',
    complete: 'Complete',
    shards: 'Shards',
  };

  // Subscribe to pipeline events
  useEffect(() => {
    const unsubscribe = tissaiaPipeline.on((event: PipelineEvent) => {
      if (event.scan) {
        setScans(prev => {
          const idx = prev.findIndex(s => s.id === event.scan!.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = event.scan!;
            return updated;
          }
          return [...prev, event.scan!];
        });

        if (selectedScan?.id === event.scan.id) {
          setSelectedScan(event.scan);
        }
      }

      if (event.type === 'scan_complete' || event.type === 'session_complete') {
        setIsProcessing(false);
      }
    });

    // Subscribe to logger
    const unsubscribeLogger = tissaiaLogger.subscribe((entry) => {
      setLogs(prev => [
        ...prev.slice(-50), // Keep last 50 logs
        {
          time: entry.timestamp.toLocaleTimeString(),
          level: entry.level,
          module: entry.module,
          msg: entry.message
        }
      ]);
    });

    // Start a session
    tissaiaPipeline.startSession(autoRestore);

    return () => {
      unsubscribe();
      unsubscribeLogger();
    };
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);

    for (const file of Array.from(files)) {
      try {
        const scan = await tissaiaPipeline.addScan(file);
        setSelectedScan(scan);
        setPendingCount(scan.heuristicProposal || 1);
      } catch (error) {
        console.error('Failed to add scan:', error);
      }
    }

    setIsProcessing(false);
    e.target.value = ''; // Reset input
  }, []);

  // Handle count confirmation
  const handleConfirmCount = useCallback(async () => {
    if (!selectedScan) return;

    setIsProcessing(true);
    try {
      await tissaiaPipeline.commitCount(selectedScan.id, pendingCount, autoRestore);
    } catch (error) {
      console.error('Failed to process:', error);
    }
    setIsProcessing(false);
  }, [selectedScan, pendingCount, autoRestore]);

  // Update cut map visualization
  useEffect(() => {
    if (showCutMap && selectedScan?.cutMap && cutMapCanvasRef.current) {
      tissaiaPipeline.visualizeCutMapOnCanvas(selectedScan.id, cutMapCanvasRef.current);
    }
  }, [showCutMap, selectedScan?.cutMap]);

  const getStageIcon = (state: string, stage: number) => {
    const currentStage = {
      'UPLOADING': 0,
      'SCANNED': 1,
      'CROPPING': 3,
      'RESTORING': 4,
      'DONE': 5,
      'ERROR': -1
    }[state] || 0;

    if (stage < currentStage) {
      return <Check className="w-4 h-4 text-emerald-400" />;
    } else if (stage === currentStage) {
      return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
    }
    return <div className="w-4 h-4 rounded-full border border-slate-600" />;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 to-slate-900 text-white overflow-hidden">
      {/* Header */}
      <header className="p-6 border-b border-white/10 flex items-center justify-between bg-black/30">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-400" />
            {t.title}
          </h1>
          <p className="text-slate-400 mt-1">{t.subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRestore}
              onChange={(e) => setAutoRestore(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800"
            />
            <span className="text-slate-300">{t.autoRestore}</span>
          </label>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium transition-all disabled:opacity-50"
          >
            <Upload className="w-5 h-5" />
            {t.uploadBtn}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Scan List */}
        <div className="w-64 border-r border-white/10 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Skany</h3>
          {scans.length === 0 ? (
            <p className="text-slate-500 text-sm">{t.noScans}</p>
          ) : (
            <div className="space-y-2">
              {scans.map(scan => (
                <div
                  key={scan.id}
                  onClick={() => {
                    setSelectedScan(scan);
                    setPendingCount(scan.operatorCommittedCount || scan.heuristicProposal || 1);
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    selectedScan?.id === scan.id
                      ? 'bg-purple-600/20 border border-purple-500/50'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium truncate">{scan.filename}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                    {getStageIcon(scan.lifecycleState, 1)}
                    {getStageIcon(scan.lifecycleState, 2)}
                    {getStageIcon(scan.lifecycleState, 3)}
                    {getStageIcon(scan.lifecycleState, 4)}
                    <span className="ml-2">
                      {scan.lifecycleState === 'DONE' ? t.complete : scan.lifecycleState}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Scan Panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedScan ? (
            <div className="space-y-6">
              {/* Thumbnail & Info */}
              <div className="flex gap-6">
                <div className="relative">
                  {selectedScan.thumbnailData && (
                    <img
                      src={selectedScan.thumbnailData}
                      alt={selectedScan.filename}
                      className="w-64 h-48 object-cover rounded-xl border border-white/10"
                    />
                  )}
                  {selectedScan.cutMap && (
                    <button
                      onClick={() => setShowCutMap(!showCutMap)}
                      className="absolute bottom-2 right-2 p-2 bg-black/80 rounded-lg hover:bg-black transition-colors"
                      title={t.viewCutMap}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex-1">
                  <h2 className="text-xl font-bold">{selectedScan.filename}</h2>
                  <p className="text-slate-400 mt-1">{selectedScan.metrics.originalResolution}</p>

                  {/* Stage Progress */}
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStageIcon(selectedScan.lifecycleState, 1)}
                      <span className="text-sm">{t.stage1}</span>
                    </div>
                    <div className="w-8 h-px bg-slate-700" />
                    <div className="flex items-center gap-2">
                      {getStageIcon(selectedScan.lifecycleState, 2)}
                      <span className="text-sm">{t.stage2}</span>
                    </div>
                    <div className="w-8 h-px bg-slate-700" />
                    <div className="flex items-center gap-2">
                      {getStageIcon(selectedScan.lifecycleState, 3)}
                      <span className="text-sm">{t.stage3}</span>
                    </div>
                    <div className="w-8 h-px bg-slate-700" />
                    <div className="flex items-center gap-2">
                      {getStageIcon(selectedScan.lifecycleState, 4)}
                      <span className="text-sm">{t.stage4}</span>
                    </div>
                  </div>

                  {/* Count Confirmation (if in SCANNED state) */}
                  {selectedScan.lifecycleState === 'SCANNED' && (
                    <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl">
                      <div className="flex items-center gap-4">
                        <label className="text-sm">
                          {t.detectedPhotos}
                          <span className="ml-2 text-purple-400 font-bold">
                            {selectedScan.heuristicProposal}
                          </span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={pendingCount}
                          onChange={(e) => setPendingCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20 px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-center"
                        />
                        <button
                          onClick={handleConfirmCount}
                          disabled={isProcessing}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-all disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          {t.confirm}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cut Map Info */}
                  {selectedScan.cutMap && (
                    <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-blue-400" />
                          <span className="text-sm">Cut Map: {selectedScan.cutMap.detectedObjects.length} objects</span>
                          <span className="text-xs text-slate-500">({selectedScan.cutMap.method})</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cut Map Visualization */}
              {showCutMap && selectedScan.cutMap && (
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <canvas
                    ref={cutMapCanvasRef}
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* Shards Grid */}
              {selectedScan.shards.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    {t.shards} ({selectedScan.shards.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedScan.shards.map((shard, index) => (
                      <div
                        key={shard.id}
                        className="relative group bg-black/30 rounded-xl overflow-hidden border border-white/10"
                      >
                        {shard.restoredImageData ? (
                          <img
                            src={shard.restoredImageData}
                            alt={`Shard ${index + 1}`}
                            className="w-full aspect-square object-cover"
                          />
                        ) : shard.croppedImageData ? (
                          <img
                            src={shard.croppedImageData}
                            alt={`Shard ${index + 1}`}
                            className="w-full aspect-square object-cover"
                          />
                        ) : (
                          <div className="w-full aspect-square flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
                          </div>
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {shard.restoredImageData && (
                            <button
                              onClick={() => downloadRestoredShard(shard, `${selectedScan.filename}_${index + 1}.png`)}
                              className="p-2 bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors"
                              title={t.download}
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                          shard.status === 'RESTORED' ? 'bg-emerald-500/80' :
                          shard.status === 'CROPPED' ? 'bg-blue-500/80' :
                          shard.status === 'ERROR' ? 'bg-red-500/80' :
                          'bg-slate-500/80'
                        }`}>
                          #{index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              <div className="text-center">
                <Upload className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>{t.noScans}</p>
              </div>
            </div>
          )}
        </div>

        {/* Logs Panel */}
        <div className="w-80 border-l border-white/10 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Logs</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
            {logs.map((log, i) => (
              <div key={i} className={`p-2 rounded ${
                log.level === 'ERROR' ? 'bg-red-900/20 text-red-400' :
                log.level === 'SUCCESS' ? 'bg-emerald-900/20 text-emerald-400' :
                log.level === 'WARN' ? 'bg-yellow-900/20 text-yellow-400' :
                'bg-slate-900/50 text-slate-400'
              }`}>
                <span className="text-slate-500">[{log.time}]</span>{' '}
                <span className="font-bold">[{log.module}]</span>{' '}
                {log.msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TissaiaPanel;
