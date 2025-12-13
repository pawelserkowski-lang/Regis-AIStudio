import React, { useState } from 'react';
import { ChevronDown, Zap, Brain, Sparkles, Gauge, Check } from 'lucide-react';
import { AIModelId, ClaudeModelId, AVAILABLE_MODELS, getModelConfig } from '../types';

/**
 * Model Selector Component
 * Allows users to switch between different AI models dynamically
 */

interface Props {
  currentModel: AIModelId;
  onModelChange: (modelId: AIModelId) => void;
  lang: 'PL' | 'EN';
}

const ModelSelector: React.FC<Props> = ({ currentModel, onModelChange, lang }) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentModelConfig = getModelConfig(currentModel);

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
    if (modelId.includes('opus')) return <Brain className="w-5 h-5" />;
    if (modelId.includes('sonnet-4')) return <Sparkles className="w-5 h-5" />;
    if (modelId.includes('sonnet')) return <Zap className="w-5 h-5" />;
    if (modelId.includes('haiku')) return <Gauge className="w-5 h-5" />;
    return <Brain className="w-5 h-5" />;
  };

  const getModelBadge = (modelId: string) => {
    if (modelId.includes('sonnet-4')) return { text: 'NEWEST', color: 'bg-purple-600' };
    if (modelId.includes('opus')) return { text: 'POWERFUL', color: 'bg-blue-600' };
    if (modelId.includes('haiku')) return { text: 'FAST', color: 'bg-green-600' };
    if (modelId.includes('sonnet')) return { text: 'BALANCED', color: 'bg-yellow-600' };
    return null;
  };

  const getPricingInfo = (modelId: ClaudeModelId) => {
    const pricing: Record<ClaudeModelId, { input: string; output: string }> = {
      'claude-sonnet-4-20250514': { input: '$3/MTok', output: '$15/MTok' },
      'claude-3-5-sonnet-20241022': { input: '$3/MTok', output: '$15/MTok' },
      'claude-3-opus-20240229': { input: '$15/MTok', output: '$75/MTok' },
      'claude-3-haiku-20240307': { input: '$0.25/MTok', output: '$1.25/MTok' },
    };
    return pricing[modelId] || { input: 'N/A', output: 'N/A' };
  };

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

  const claudeModels = AVAILABLE_MODELS.filter(m => m.provider === 'claude');

  return (
    <div className="model-selector relative">
      {/* Current Model Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl hover:border-emerald-500/50 transition-all group"
      >
        <div className="text-emerald-400">
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
        <div className="absolute top-full left-0 mt-2 w-96 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              {t.claude}
            </h3>
          </div>

          {/* Model List */}
          <div className="max-h-96 overflow-y-auto">
            {claudeModels.map(model => {
              const isSelected = model.id === currentModel;
              const badge = getModelBadge(model.id);
              const pricing = getPricingInfo(model.id as ClaudeModelId);

              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onModelChange(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-4 transition-all border-b border-white/5 ${
                    isSelected
                      ? 'bg-emerald-600/20 border-l-4 border-l-emerald-500'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-600/20 text-emerald-400' : 'bg-white/5 text-slate-400'}`}>
                        {getModelIcon(model.id)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-semibold ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                            {model.name}
                          </span>
                          {badge && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.color} text-white font-bold`}>
                              {badge.text}
                            </span>
                          )}
                          {isSelected && (
                            <Check className="w-4 h-4 text-emerald-400 ml-auto" />
                          )}
                        </div>

                        <p className="text-xs text-slate-400 mb-2">{model.description}</p>

                        <div className="flex flex-wrap gap-2 text-[10px]">
                          <span className="px-2 py-1 bg-white/5 rounded text-slate-400">
                            {t.context}: {model.maxTokens / 1000}K
                          </span>
                          {model.supportsVision && (
                            <span className="px-2 py-1 bg-blue-600/20 rounded text-blue-400">
                              {t.vision}
                            </span>
                          )}
                          {model.supportsStreaming && (
                            <span className="px-2 py-1 bg-green-600/20 rounded text-green-400">
                              {t.streaming}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 text-[10px] text-slate-500">
                          {t.pricing}: {pricing.input} → {pricing.output}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-3 bg-white/5 text-center">
            <p className="text-[10px] text-slate-500">
              {lang === 'PL'
                ? 'Model jest zapisywany dla bieżącej sesji'
                : 'Model is saved for current session'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
