import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  ShoppingCart,
  AlertTriangle,
  BookOpen,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  History,
  FlaskConical,
  Sliders,
  FileText,
  Package,
  Database,
  HardDrive
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getHelpGuideData } from '../data/helpGuideData';

const TOPIC_ICONS = {
  dispense: ShoppingCart,
  stockin: ArrowDownToLine,
  inventory: Package,
  ui_modes: Sliders,
  expired: ShieldAlert,
  alerts: AlertTriangle,
  backup_exit: HardDrive,
  fefo_intelligence: TrendingUp,
  po_procurement: FileText,
  audit_compliance: History,
  simulation_engine: FlaskConical,
  disaster_recovery: Database,
};

export default function HelpGuideModal({ isOpen, onClose, onNavigate }) {
  const { language } = useLanguage();
  const [guideVersion, setGuideVersion] = useState('v1'); // 'v1' = Basic, 'v2' = Advance
  const [activeTopic, setActiveTopic] = useState('dispense');

  if (!isOpen) return null;

  const guide = getHelpGuideData(language);
  const currentCategory = guideVersion === 'v1' ? guide.v1 : guide.v2;
  const topicKeys = Object.keys(currentCategory);
  const currentTopic = currentCategory[activeTopic] || currentCategory[topicKeys[0]];

  const handleVersionChange = (ver) => {
    setGuideVersion(ver);
    if (ver === 'v1') {
      setActiveTopic('dispense');
    } else {
      setActiveTopic('fefo_intelligence');
    }
  };

  const handleCtaClick = (target) => {
    if (target === 'exit') {
      onClose();
    } else if (onNavigate && target) {
      onNavigate(target);
      onClose();
    }
  };

  // Determine banner theme based on topic
  const isDanger = activeTopic === 'expired';
  const isWarning = activeTopic === 'alerts';
  const BannerIcon = TOPIC_ICONS[activeTopic] || CheckCircle2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#161b22] rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200/90 dark:border-white/10 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-50/90 dark:bg-[#1e2430] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {guide.meta.title}
                </h2>
                <span className="bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-700/40 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider tabular-nums">
                  {guideVersion === 'v1' ? guide.meta.basicGuideLabel : guide.meta.advanceGuideLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {guideVersion === 'v1' ? guide.meta.descBasic : guide.meta.descAdvance}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Guide Version Switcher (Basic vs Advance) */}
            <div className="bg-slate-100/90 dark:bg-[#161b22] p-1 rounded-xl border border-slate-200/80 dark:border-white/10 flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleVersionChange('v1')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  guideVersion === 'v1'
                    ? 'bg-white dark:bg-[#21262d] text-teal-700 dark:text-teal-300 shadow-xs border border-slate-200/60 dark:border-white/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{guide.meta.basicGuideLabel}</span>
                <span className="text-[10px] opacity-75 font-normal hidden sm:inline">({guide.meta.basicGuideSub})</span>
              </button>
              <button
                type="button"
                onClick={() => handleVersionChange('v2')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  guideVersion === 'v2'
                    ? 'bg-white dark:bg-[#21262d] text-teal-700 dark:text-teal-300 shadow-xs border border-slate-200/60 dark:border-white/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{guide.meta.advanceGuideLabel}</span>
                <span className="text-[10px] opacity-75 font-normal hidden sm:inline">({guide.meta.advanceGuideSub})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
              title={guide.meta.closeBtn}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Topic Selector Tabs */}
        <div className={`grid gap-1.5 p-3 bg-slate-50/50 dark:bg-[#161b22]/50 border-b border-slate-100 dark:border-white/10 ${
          guideVersion === 'v1' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
        }`}>
          {topicKeys.map((key, idx) => {
            const item = currentCategory[key];
            const Icon = TOPIC_ICONS[key] || CheckCircle2;
            const isSelected = activeTopic === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTopic(key)}
                className={`flex flex-col text-left p-2.5 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-[#1e2430] text-slate-900 dark:text-white border-teal-500/60 dark:border-teal-500 shadow-xs ring-1 ring-teal-500/30'
                    : 'bg-white/80 dark:bg-[#1e2430]/60 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:bg-white dark:hover:bg-[#1e2430] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`w-4 h-4 rounded-full text-[10px] font-extrabold flex items-center justify-center tabular-nums ${
                    isSelected ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {idx + 1}
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                </div>
                <div className="font-bold text-xs leading-tight line-clamp-1">{item.title}</div>
                <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight truncate">{item.sub}</div>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-200 flex-1 text-xs">
          {currentTopic && (
            <div className="space-y-3.5 animate-in fade-in">
              {/* Banner Card */}
              <div className={`p-4 rounded-2xl border ${
                isDanger
                  ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-200'
                  : isWarning
                  ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200'
                  : 'bg-teal-50/90 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900/60 text-teal-950 dark:text-teal-200'
              }`}>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <BannerIcon className={`w-4 h-4 shrink-0 ${
                    isDanger ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-teal-600 dark:text-teal-400'
                  }`} />
                  <span>{currentTopic.bannerTitle}</span>
                </h3>
                <p className="text-xs mt-1.5 leading-relaxed opacity-90">
                  {currentTopic.bannerDesc}
                </p>
              </div>

              {/* Steps List */}
              <ol className="space-y-2.5">
                {currentTopic.steps.map((step, sIdx) => (
                  <li
                    key={sIdx}
                    className="flex items-start gap-3.5 p-3.5 bg-slate-50/80 dark:bg-[#1e2430]/70 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition"
                  >
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0 tabular-nums shadow-xs">
                      {sIdx + 1}
                    </span>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <strong className="text-xs font-bold text-slate-900 dark:text-white block">
                        {step.title}
                      </strong>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              {/* Action / CTA Button */}
              {currentTopic.ctaText && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleCtaClick(currentTopic.ctaTarget)}
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-[0.99] rounded-xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <ArrowUpFromLine className="w-4 h-4" />
                    <span>{currentTopic.ctaText}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50/90 dark:bg-[#1e2430] border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="tabular-nums text-[10px]">
            {guide.meta.footerNote}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            {guide.meta.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
