// ─────────────────────────────────────────────────────────────────────────────
// Onboarding.tsx — First-launch wizard shown before the main browser UI.
//
// Steps:
//   0 — Welcome            Intro to Vyro, platform awareness
//   1 — Ollama check       Detect if Ollama is running, show install guide
//   2 — Model selection    Pull recommended models or confirm existing ones
//   3 — Ready              All set, launch button
//
// All steps are self-contained sections of this file for clarity.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import {
  useOnboarding,
  TOTAL_STEPS,
  OllamaModel,
  PullStatus,
} from '../hooks/useOnboarding';

// ── Small shared primitives ──────────────────────────────────────────────────

const StepDots: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="flex items-center justify-center gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <span
        key={i}
        className={[
          'w-2 h-2 rounded-full transition-all duration-300',
          i === current
            ? 'bg-violet-500 w-4'
            : i < current
            ? 'bg-violet-400/50'
            : 'bg-white/20',
        ].join(' ')}
      />
    ))}
  </div>
);

const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <button
    {...props}
    className={[
      'px-6 py-2.5 rounded-xl font-semibold text-sm bg-violet-600 hover:bg-violet-500',
      'text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed',
      'focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-transparent',
      className,
    ].join(' ')}
  >
    {children}
  </button>
);

const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <button
    {...props}
    className={[
      'px-5 py-2.5 rounded-xl text-sm text-white/50 hover:text-white/80',
      'transition-colors duration-200 focus:outline-none',
      className,
    ].join(' ')}
  >
    {children}
  </button>
);

// ── Step 0: Welcome ──────────────────────────────────────────────────────────

const StepWelcome: React.FC<{ onNext: () => void; onSkip: () => void }> = ({
  onNext,
  onSkip,
}) => {
  const platform = typeof window !== 'undefined' && window.vyro ? window.vyro.platform : 'darwin';
  const platformLabel =
    platform === 'darwin' ? 'macOS' : platform === 'win32' ? 'Windows' : 'Linux';

  return (
    <div className="flex flex-col items-center text-center gap-6 max-w-md">
      {/* Logo */}
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-violet-900/50">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M12 6v6l4 2" />
          </svg>
        </div>
        <span className="absolute -bottom-1 -right-1 text-xs font-bold bg-violet-500 text-white px-1.5 py-0.5 rounded-full">
          v2
        </span>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome to Vyro</h1>
        <p className="text-white/60 text-sm leading-relaxed">
          An AI-powered browser running entirely on your {platformLabel} machine.
          No cloud, no subscriptions — your data stays yours.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full">
        {[
          { icon: '🧠', label: 'Local AI', desc: 'Ollama runs on device' },
          { icon: '🚫', label: 'Ad-free', desc: 'Network-level blocking' },
          { icon: '⌨️', label: 'Keyboard-first', desc: 'Cmd+K for everything' },
        ].map(({ icon, label, desc }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/10"
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-semibold text-white">{label}</span>
            <span className="text-[11px] text-white/40 text-center leading-tight">{desc}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 w-full">
        <PrimaryButton onClick={onNext} className="w-full">
          Get started →
        </PrimaryButton>
        <GhostButton onClick={onSkip}>
          Skip setup — take me to the browser
        </GhostButton>
      </div>
    </div>
  );
};

// ── Step 1: Ollama check ──────────────────────────────────────────────────────

const StepOllama: React.FC<{
  ollamaRunning: boolean | null;
  ollamaUrl: string;
  onCheck: () => Promise<void>;
  onNext: () => void;
  onBack: () => void;
}> = ({ ollamaRunning, ollamaUrl, onCheck, onNext, onBack }) => {
  const [checking, setChecking] = React.useState(false);
  const platform = typeof window !== 'undefined' && window.vyro ? window.vyro.platform : 'darwin';

  const installCmd =
    platform === 'darwin'
      ? 'brew install ollama && brew services start ollama'
      : platform === 'win32'
      ? 'winget install Ollama.Ollama'
      : 'curl -fsSL https://ollama.com/install.sh | sh';

  const handleCheck = async () => {
    setChecking(true);
    await onCheck();
    setChecking(false);
  };

  return (
    <div className="flex flex-col gap-5 max-w-md w-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">AI Engine Setup</h2>
        <p className="text-white/50 text-sm">
          Vyro uses{' '}
          <a
            className="text-violet-400 hover:text-violet-300"
            onClick={() => window.vyro?.invoke('nav:load-url' as never, { url: 'https://ollama.com', tabId: 'new' })}
          >
            Ollama
          </a>{' '}
          to run large language models locally.
        </p>
      </div>

      {/* Status card */}
      <div
        className={[
          'flex items-center gap-3 p-4 rounded-xl border',
          ollamaRunning === true
            ? 'bg-green-900/30 border-green-500/40 text-green-300'
            : ollamaRunning === false
            ? 'bg-red-900/20 border-red-500/30 text-red-300'
            : 'bg-white/5 border-white/10 text-white/50',
        ].join(' ')}
      >
        <span className="text-2xl">
          {ollamaRunning === true ? '✅' : ollamaRunning === false ? '❌' : '🔍'}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">
            {ollamaRunning === true
              ? 'Ollama is running'
              : ollamaRunning === false
              ? 'Ollama not detected'
              : 'Checking for Ollama…'}
          </span>
          <span className="text-xs opacity-70">{ollamaUrl}</span>
        </div>
        <button
          onClick={handleCheck}
          disabled={checking}
          className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors disabled:opacity-40"
        >
          {checking ? 'Checking…' : 'Re-check'}
        </button>
      </div>

      {ollamaRunning === false && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-white/60">Install Ollama then click Re-check:</p>
          <div className="relative group">
            <pre className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap">
              {installCmd}
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(installCmd).catch(() => undefined)}
              className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/40 hover:text-white/80 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              copy
            </button>
          </div>
          <p className="text-xs text-white/40">
            Or download the desktop app from{' '}
            <span className="text-violet-400">ollama.com</span>
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 mt-2">
        <GhostButton onClick={onBack}>← Back</GhostButton>
        <PrimaryButton onClick={onNext} disabled={ollamaRunning !== true} className="flex-1">
          {ollamaRunning === true ? 'Continue →' : 'Skip AI setup'}
        </PrimaryButton>
        {ollamaRunning !== true && (
          <GhostButton onClick={onNext}>Skip →</GhostButton>
        )}
      </div>
    </div>
  );
};

// ── Step 2: Model selection / pull ────────────────────────────────────────────

interface RecommendedModel {
  name: string;
  label: string;
  description: string;
  sizeLabel: string;
  vram: string;
}

const RECOMMENDED_MODELS: RecommendedModel[] = [
  {
    name: 'llama3.2',
    label: 'Llama 3.2 3B',
    description: 'Fast, lightweight — great for quick answers',
    sizeLabel: '~2 GB',
    vram: '4 GB RAM',
  },
  {
    name: 'llama3.1:8b',
    label: 'Llama 3.1 8B',
    description: 'Balanced — best quality/speed trade-off',
    sizeLabel: '~5 GB',
    vram: '8 GB RAM',
  },
  {
    name: 'qwen2.5-coder:7b',
    label: 'Qwen 2.5 Coder 7B',
    description: 'Coding specialist — excellent for dev workflows',
    sizeLabel: '~4.7 GB',
    vram: '8 GB RAM',
  },
];

const ModelRow: React.FC<{
  model: RecommendedModel;
  installed: boolean;
  status?: PullStatus;
  onPull: () => void;
  onCancel: () => void;
}> = ({ model, installed, status, onPull, onCancel }) => {
  const phase = status?.phase ?? 'idle';

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white truncate">{model.label}</span>
          {installed && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium shrink-0">
              Installed
            </span>
          )}
        </div>
        <p className="text-xs text-white/40 truncate">{model.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-white/30">{model.sizeLabel}</span>
          <span className="text-[10px] text-white/20">·</span>
          <span className="text-[10px] text-white/30">{model.vram}</span>
        </div>
        {phase === 'pulling' && (
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-white/40 mb-1">
              <span>{status?.statusText}</span>
              <span>{status?.percent}%</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-300"
                style={{ width: `${status?.percent ?? 0}%` }}
              />
            </div>
          </div>
        )}
        {phase === 'error' && (
          <p className="text-[11px] text-red-400 mt-1">{status?.error}</p>
        )}
      </div>

      <div className="shrink-0">
        {installed || phase === 'complete' ? (
          <span className="text-green-400 text-lg">✓</span>
        ) : phase === 'pulling' ? (
          <button
            onClick={onCancel}
            className="text-xs px-2.5 py-1 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
          >
            Cancel
          </button>
        ) : (
          <button
            onClick={onPull}
            className="text-xs px-2.5 py-1 rounded-lg bg-violet-600/30 text-violet-300 hover:bg-violet-600/50 transition-colors"
          >
            Pull
          </button>
        )}
      </div>
    </div>
  );
};

const StepModels: React.FC<{
  models: OllamaModel[];
  pullStatus: Record<string, PullStatus>;
  ollamaRunning: boolean | null;
  onPull: (name: string) => Promise<void>;
  onCancel: (name: string) => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ models, pullStatus, ollamaRunning, onPull, onCancel, onNext, onBack }) => {
  const installedNames = new Set(models.map(m => m.name));
  const hasAny =
    installedNames.size > 0 ||
    Object.values(pullStatus).some(s => s.phase === 'complete');

  return (
    <div className="flex flex-col gap-4 max-w-md w-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Choose a Model</h2>
        <p className="text-white/50 text-sm">
          Pull at least one model to use the AI assistant. You can add more later.
        </p>
      </div>

      {!ollamaRunning && (
        <div className="p-3 rounded-xl bg-amber-900/20 border border-amber-500/30 text-amber-300 text-xs">
          Ollama isn't running — model pulls will fail. Go back to set it up.
        </div>
      )}

      <div className="flex flex-col gap-2">
        {RECOMMENDED_MODELS.map(m => (
          <ModelRow
            key={m.name}
            model={m}
            installed={installedNames.has(m.name)}
            status={pullStatus[m.name]}
            onPull={() => onPull(m.name)}
            onCancel={() => onCancel(m.name)}
          />
        ))}
      </div>

      {models.length > 0 && (
        <p className="text-xs text-white/30 text-center">
          {models.length} model{models.length !== 1 ? 's' : ''} already installed
        </p>
      )}

      <div className="flex items-center gap-3 mt-1">
        <GhostButton onClick={onBack}>← Back</GhostButton>
        <PrimaryButton onClick={onNext} className="flex-1">
          {hasAny ? 'Continue →' : 'Skip for now →'}
        </PrimaryButton>
      </div>
    </div>
  );
};

// ── Step 3: Ready ─────────────────────────────────────────────────────────────

const StepReady: React.FC<{
  models: OllamaModel[];
  ollamaRunning: boolean | null;
  onComplete: () => void;
  onBack: () => void;
}> = ({ models, ollamaRunning, onComplete, onBack }) => (
  <div className="flex flex-col items-center text-center gap-6 max-w-md">
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-900/50">
      <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>

    <div>
      <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
      <p className="text-white/50 text-sm leading-relaxed">
        {ollamaRunning && models.length > 0
          ? `Ollama is running with ${models.length} model${models.length !== 1 ? 's' : ''}. Open the sidebar (≡) to start chatting.`
          : ollamaRunning
          ? 'Ollama is running. Pull a model from the AI panel sidebar when you\'re ready.'
          : 'You can set up the AI assistant anytime from the sidebar or Settings.'}
      </p>
    </div>

    <div className="grid grid-cols-2 gap-2 w-full text-left">
      {[
        { shortcut: 'Cmd+K', desc: 'Command palette' },
        { shortcut: 'Cmd+T', desc: 'New tab' },
        { shortcut: 'Cmd+L', desc: 'Focus address bar' },
        { shortcut: 'Cmd+F', desc: 'Find in page' },
      ].map(({ shortcut, desc }) => (
        <div key={shortcut} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5">
          <kbd className="text-[10px] font-mono bg-white/10 text-white/70 px-1.5 py-0.5 rounded shrink-0">
            {shortcut}
          </kbd>
          <span className="text-xs text-white/50">{desc}</span>
        </div>
      ))}
    </div>

    <div className="flex items-center gap-3 w-full">
      <GhostButton onClick={onBack}>← Back</GhostButton>
      <PrimaryButton onClick={onComplete} className="flex-1">
        Launch Vyro →
      </PrimaryButton>
    </div>
  </div>
);

// ── Root Onboarding component ─────────────────────────────────────────────────

export const Onboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const {
    currentStep,
    ollamaRunning,
    ollamaUrl,
    models,
    pullStatus,
    checkOllama,
    pullModel,
    cancelPull,
    listModels,
    next,
    back,
    complete,
    skip,
  } = useOnboarding();

  // Check Ollama and list models whenever we arrive on those steps.
  useEffect(() => {
    if (currentStep === 1) {
      checkOllama();
    }
    if (currentStep === 2) {
      listModels();
    }
  }, [currentStep, checkOllama, listModels]);

  const handleComplete = () => {
    complete();
    onComplete();
  };

  const handleSkip = () => {
    skip();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0f0f10]">
      {/* Ambient gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-violet-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-900/20 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 w-full max-w-xl">
        {/* Step dots */}
        <StepDots current={currentStep} total={TOTAL_STEPS} />

        {/* Step content */}
        <div className="w-full flex justify-center">
          {currentStep === 0 && (
            <StepWelcome onNext={next} onSkip={handleSkip} />
          )}
          {currentStep === 1 && (
            <StepOllama
              ollamaRunning={ollamaRunning}
              ollamaUrl={ollamaUrl}
              onCheck={checkOllama}
              onNext={next}
              onBack={back}
            />
          )}
          {currentStep === 2 && (
            <StepModels
              models={models}
              pullStatus={pullStatus}
              ollamaRunning={ollamaRunning}
              onPull={pullModel}
              onCancel={cancelPull}
              onNext={next}
              onBack={back}
            />
          )}
          {currentStep === 3 && (
            <StepReady
              models={models}
              ollamaRunning={ollamaRunning}
              onComplete={handleComplete}
              onBack={back}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
