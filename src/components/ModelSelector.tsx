import React, { useState, useEffect } from 'react';
import { ChevronDown, Zap, Brain, Sparkles, Gauge, Check, RefreshCw, Loader2, Cpu, Bot } from 'lucide-react';
import { AIModelId, AVAILABLE_MODELS, getModelConfig, AIModelConfig, mergeModels, APIModelInfo, AIProvider } from '../types';
import { fetchAllModels, getCachedModels } from '../services/ai/config';

/**
 * Model Selector Component
 * Allows users to switch between different AI models dynamically
 * Fetches available models from Claude API at startup
 */

interface Props {
  currentModel: AIModelId;
  onModelChange: (modelId: AIModelId) => void;
  lang: 'PL' | 'EN';
}

const ModelSelector: React.FC<Props> = ({ currentModel, onModelChange, lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<AIModelConfig[]>(AVAILABLE_MODELS);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  // Fetch models on component mount
  useEffect(() => {
    const loadModels = async () => {
      // Check if models are already cached
      const cached = getCachedModels();
      if (cached && cached.claude.length > 0 || cached.gemini.length > 0 || cached.grok.length > 0) {
        setAvailableModels(mergeModels(
          cached.claude as APIModelInfo[],
          cached.gemini as APIModelInfo[],
          cached.grok as APIModelInfo[]
        ));
        return;
      }

      setIsLoadingModels(true);
      setModelsError(null);

      try {
        const apiModels = await fetchAllModels();
        setAvailableModels(mergeModels(
          apiModels.claude as APIModelInfo[],
          apiModels.gemini as APIModelInfo[],
          apiModels.grok as APIModelInfo[]
        ));
      } catch (error) {
        console.error('Failed to fetch models:', error);
        setModelsError('Failed to load models from API');
        // Keep using fallback models
      } finally {
        setIsLoadingModels(false);
      }
    };

    loadModels();
  }, []);

  // Refresh models from API
  const handleRefreshModels = async () => {
    setIsLoadingModels(true);
    setModelsError(null);

    try {
      // Clear cache and fetch fresh
      const { clearModelsCache } = await import('../services/ai/config');
      clearModelsCache();
      const apiModels = await fetchAllModels();
      setAvailableModels(mergeModels(
        apiModels.claude as APIModelInfo[],
        apiModels.gemini as APIModelInfo[],
        apiModels.grok as APIModelInfo[]
      ));
    } catch (error) {
      console.error('Failed to refresh models:', error);
      setModelsError('Failed to refresh models');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const currentModelConfig = getModelConfig(currentModel, availableModels);

  const t = lang === 'PL' ? {
    selectModel: 'Wybierz Model',
    current: 'Aktualny',
    claude: 'Claude (Anthropic)',
    pricing: 'Cennik',
    capabilities: 'Możliwości',
    vision: 'Wizja',
    streaming: 'Streaming',
    context: 'Kontekst',
    speed: 'Szybkość',
    quality: 'Jakość',
  } : {
    selectModel: 'Select Model',
    current: 'Current',
    claude: 'Claude (Anthropic)',
    pricing: 'Pricing',
    capabilities: 'Capabilities',
    vision: 'Vision',
    streaming: 'Streaming',
    context: 'Context',
    speed: 'Speed',
    quality: 'Quality',
  };

  const getModelIcon = (modelId: string) => {
    // Claude
    if (modelId.includes('opus')) return <Brain className="w-5 h-5" />;
    if (modelId.includes('sonnet-4')) return <Sparkles className="w-5 h-5" />;
    if (modelId.includes('sonnet')) return <Zap className="w-5 h-5" />;
    if (modelId.includes('haiku')) return <Gauge className="w-5 h-5" />;
    // Gemini
    if (modelId.includes('gemini')) return <Cpu className="w-5 h-5" />;
    // Grok
    if (modelId.includes('grok')) return <Bot className="w-5 h-5" />;
    return <Brain className="w-5 h-5" />;
  };

  const getModelBadge = (modelId: string) => {
    // Claude badges
    if (modelId.includes('sonnet-4')) return { text: 'NEWEST', color: 'bg-purple-600' };
    if (modelId.includes('opus')) return { text: 'POWERFUL', color: 'bg-blue-600' };
    if (modelId.includes('haiku')) return { text: 'FAST', color: 'bg-green-600' };
    if (modelId.includes('sonnet')) return { text: 'BALANCED', color: 'bg-yellow-600' };
    // Gemini badges
    if (modelId.includes('gemini-2.5-pro')) return { text: 'FLAGSHIP', color: 'bg-blue-500' };
    if (modelId.includes('gemini-2.5-flash')) return { text: 'THINKING', color: 'bg-cyan-600' };
    if (modelId.includes('flash-lite')) return { text: 'LITE', color: 'bg-teal-600' };
    if (modelId.includes('flash')) return { text: 'FAST', color: 'bg-green-600' };
    // Grok badges
    if (modelId === 'grok-3') return { text: 'FLAGSHIP', color: 'bg-orange-600' };
    if (modelId.includes('grok-3-fast')) return { text: 'FAST', color: 'bg-green-600' };
    if (modelId.includes('grok-3-mini-fast')) return { text: 'FASTEST', color: 'bg-lime-600' };
    if (modelId.includes('grok-3-mini')) return { text: 'MINI', color: 'bg-amber-600' };
    return null;
  };

  // Note: getPricingInfo reserved for future use when pricing display is needed

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.model-selector')) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  const claudeModels = availableModels.filter(m => m.provider === 'claude');
  const geminiModels = availableModels.filter(m => m.provider === 'gemini');
  const grokModels = availableModels.filter(m => m.provider === 'grok');

  const getProviderColor = (provider: AIProvider) => {
    switch (provider) {
      case 'claude': return 'text-purple-400';
      case 'gemini': return 'text-blue-400';
      case 'grok': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  const renderModelList = (models: AIModelConfig[], providerName: string, icon: React.ReactNode, gradientClass: string) => (
    <>
      {/* Provider Header */}
      <div className={`p-3 border-b border-white/10 ${gradientClass}`}>
        <h3 className="text-xs font-bold text-white flex items-center gap-2">
          {icon}
          {providerName}
          <span className="text-slate-500 font-normal">({models.length})</span>
        </h3>
      </div>
      {/* Models */}
      {models.map(model => {
        const isSelected = model.id === currentModel;
        const badge = getModelBadge(model.id);

        return (
          <button
            key={model.id}
            onClick={() => {
              onModelChange(model.id);
              setIsOpen(false);
            }}
            className={`w-full text-left p-3 transition-all border-b border-white/5 ${
              isSelected
                ? 'bg-emerald-600/20 border-l-4 border-l-emerald-500'
                : 'hover:bg-white/5'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-emerald-600/20 text-emerald-400' : 'bg-white/5 ' + getProviderColor(model.provider)}`}>
                {getModelIcon(model.id)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`font-semibold text-sm ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                    {model.name}
                  </span>
                  {badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${badge.color} text-white font-bold`}>
                      {badge.text}
                    </span>
                  )}
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto flex-shrink-0" />
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mb-1.5 truncate">{model.description}</p>

                <div className="flex flex-wrap gap-1.5 text-[9px]">
                  <span className="px-1.5 py-0.5 bg-white/5 rounded text-slate-400">
                    {(model.maxTokens / 1000).toFixed(0)}K ctx
                  </span>
                  {model.supportsVision && (
                    <span className="px-1.5 py-0.5 bg-blue-600/20 rounded text-blue-400">
                      Vision
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </>
  );

  return (
    <div className="model-selector relative">
      {/* Current Model Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl hover:border-emerald-500/50 transition-all group"
      >
        <div className={getProviderColor(currentModelConfig?.provider || 'claude')}>
          {getModelIcon(currentModel)}
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs text-slate-500">{t.current}</span>
          <span className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
            {currentModelConfig?.name || 'Unknown Model'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[420px] bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header with Refresh */}
          <div className="p-3 border-b border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {t.selectModel}
              {isLoadingModels && (
                <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />
              )}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRefreshModels();
              }}
              disabled={isLoadingModels}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
              title={lang === 'PL' ? 'Odśwież listę modeli' : 'Refresh model list'}
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoadingModels ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {modelsError && (
            <p className="text-[10px] text-red-400 px-3 py-1 bg-red-900/20">{modelsError}</p>
          )}

          {/* Model List - Scrollable */}
          <div className="max-h-[60vh] overflow-y-auto">
            {/* Claude Models */}
            {claudeModels.length > 0 && renderModelList(
              claudeModels,
              'Claude (Anthropic)',
              <Brain className="w-4 h-4 text-purple-400" />,
              'bg-gradient-to-r from-purple-900/20 to-purple-800/10'
            )}

            {/* Gemini Models */}
            {geminiModels.length > 0 && renderModelList(
              geminiModels,
              'Gemini (Google)',
              <Cpu className="w-4 h-4 text-blue-400" />,
              'bg-gradient-to-r from-blue-900/20 to-blue-800/10'
            )}

            {/* Grok Models */}
            {grokModels.length > 0 && renderModelList(
              grokModels,
              'Grok (xAI)',
              <Bot className="w-4 h-4 text-orange-400" />,
              'bg-gradient-to-r from-orange-900/20 to-orange-800/10'
            )}
          </div>

          {/* Footer */}
          <div className="p-2 bg-white/5 text-center border-t border-white/10">
            <p className="text-[10px] text-slate-500">
              {availableModels.length} {lang === 'PL' ? 'modeli dostępnych' : 'models available'} •
              {lang === 'PL'
                ? ' Model zapisywany dla sesji'
                : ' Model saved for session'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
