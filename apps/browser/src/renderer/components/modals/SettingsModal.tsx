import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../shared/Modal';
import { useUiStore } from '../../store/ui.store';
import { useSettingsStore } from '../../store/settings.store';
import { Theme, SearchEngine, AppSettings, DEFAULT_SETTINGS, SEARCH_ENGINES, ACCENT_PRESETS } from '@shared/types/settings';
import { ipc, IPC } from '../../lib/ipc';
import { DEFAULT_PROFILE_ID } from '@shared/constants';
import { KeywordEntry, CustomKeyword } from '@shared/keyword-engine/types';

type Tab = 'general' | 'appearance' | 'privacy' | 'ai' | 'keywords';

// Feature flag: the Keywords management UI is fully built and wired (see
// KeywordsTab / KeywordForm below and the keyword IPC/services/DB). It is hidden
// from the Settings navigation for now. Flip this to `true` to restore the tab —
// no other code needs to change.
const KEYWORDS_TAB_ENABLED = false;

interface KeywordsData {
  builtin: KeywordEntry[];
  custom: CustomKeyword[];
}

const EMPTY_FORM = {
  keyword: '', aliases: '', url: '', searchUrl: '', name: '', favicon: '', category: 'other', enabled: true,
};

const KeywordForm: React.FC<{
  initial?: CustomKeyword | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}> = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(() => initial ? {
    keyword: initial.keyword,
    aliases: initial.aliases.join(', '),
    url: initial.url,
    searchUrl: initial.searchUrl,
    name: initial.name,
    favicon: initial.favicon,
    category: initial.category,
    enabled: initial.enabled,
  } : EMPTY_FORM);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.keyword.trim() || !form.url.trim() || !form.name.trim()) return;
    onSave({
      id: initial?.id,
      keyword: form.keyword.trim().toLowerCase(),
      aliases: form.aliases.split(',').map(a => a.trim()).filter(Boolean),
      url: form.url.trim(),
      searchUrl: form.searchUrl.trim() || form.url.trim(),
      name: form.name.trim(),
      favicon: form.favicon.trim(),
      category: form.category,
      enabled: form.enabled,
    });
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-vyro-500/50';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/40 mb-1">Keyword *</label>
          <input className={inputCls} value={form.keyword} onChange={e => set('keyword', e.target.value)} placeholder="e.g. gh" required />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Name *</label>
          <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. GitHub" required />
        </div>
      </div>
      <div>
        <label className="block text-xs text-white/40 mb-1">Aliases (comma-separated)</label>
        <input className={inputCls} value={form.aliases} onChange={e => set('aliases', e.target.value)} placeholder="e.g. github, git" />
      </div>
      <div>
        <label className="block text-xs text-white/40 mb-1">Homepage URL *</label>
        <input className={inputCls} value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://github.com" required />
      </div>
      <div>
        <label className="block text-xs text-white/40 mb-1">Search URL (use {'{query}'} placeholder)</label>
        <input className={inputCls} value={form.searchUrl} onChange={e => set('searchUrl', e.target.value)} placeholder="https://github.com/search?q={query}" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/40 mb-1">Favicon URL</label>
          <input className={inputCls} value={form.favicon} onChange={e => set('favicon', e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Category</label>
          <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
            {['search','social','video','dev','productivity','shopping','ai','gaming','music','education','news','finance','messaging','storage','maps','streaming','design','other'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer select-none">
        <input type="checkbox" checked={form.enabled} onChange={e => set('enabled', e.target.checked)} className="w-4 h-4 rounded accent-vyro-500" />
        Enabled
      </label>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-1.5 text-sm text-white/50 hover:text-white transition-colors">Cancel</button>
        <button type="submit" className="px-4 py-1.5 text-sm bg-vyro-600 hover:bg-vyro-500 text-white rounded-lg transition-colors">
          {initial ? 'Save changes' : 'Add keyword'}
        </button>
      </div>
    </form>
  );
};

const KeywordsTab: React.FC = () => {
  const [data, setData] = useState<KeywordsData>({ builtin: [], custom: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<'builtin' | 'custom'>('builtin');
  const [editingCustom, setEditingCustom] = useState<CustomKeyword | null | 'new'>(null);
  const [statusMsg, setStatusMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ipc.invoke<KeywordsData>(IPC.KEYWORDS_GET_ALL, {});
      setData(result);
    } catch {
      
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const handleToggleBuiltin = async (keyword: string, enabled: boolean) => {
    await ipc.invoke(IPC.KEYWORDS_TOGGLE, { keyword, enabled, isBuiltin: true });
    setData(d => ({
      ...d,
      builtin: d.builtin.map(e => e.keyword === keyword ? { ...e, enabled } : e),
    }));
  };

  const handleToggleCustom = async (keyword: string, enabled: boolean) => {
    await ipc.invoke(IPC.KEYWORDS_TOGGLE, { keyword, enabled, isBuiltin: false });
    setData(d => ({
      ...d,
      custom: d.custom.map(e => e.keyword === keyword ? { ...e, enabled } : e),
    }));
  };

  const handleSaveCustom = async (formData: any) => {
    const saved = await ipc.invoke<CustomKeyword>(IPC.KEYWORDS_SAVE_CUSTOM, formData);
    await load();
    setEditingCustom(null);
    flash(formData.id ? 'Keyword updated.' : 'Keyword added.');
  };

  const handleDeleteCustom = async (keyword: string) => {
    if (!confirm(`Delete keyword "${keyword}"?`)) return;
    await ipc.invoke(IPC.KEYWORDS_DELETE_CUSTOM, { keyword });
    setData(d => ({ ...d, custom: d.custom.filter(c => c.keyword !== keyword) }));
    flash('Keyword deleted.');
  };

  const handleReset = async () => {
    if (!confirm('Reset all built-in keywords to defaults? Custom keywords are unaffected.')) return;
    await ipc.invoke(IPC.KEYWORDS_RESET, {});
    await load();
    flash('Built-in keywords reset to defaults.');
  };

  const handleExport = async () => {
    const json = await ipc.invoke<string>(IPC.KEYWORDS_EXPORT, {});
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vyro-keywords.json';
    a.click();
    flash('Exported.');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      const count = await ipc.invoke<number>(IPC.KEYWORDS_IMPORT, { json: text });
      await load();
      flash(`Imported ${count} keyword(s).`);
    };
    input.click();
  };

  const q = search.toLowerCase();
  const filteredBuiltin = data.builtin.filter(e =>
    !q || e.keyword.includes(q) || e.name.toLowerCase().includes(q) || e.aliases.some(a => a.includes(q))
  );
  const filteredCustom = data.custom.filter(e =>
    !q || e.keyword.includes(q) || e.name.toLowerCase().includes(q) || e.aliases.some(a => a.includes(q))
  );

  const rowCls = 'flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group';
  const badgeCls = 'text-xs px-1.5 py-0.5 rounded text-white/30 bg-white/5';

  return (
    <div className="flex flex-col gap-4">
      {}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5">
          <svg className="w-3.5 h-3.5 text-white/30" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter keywords…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
          />
        </div>
        <button onClick={handleImport} className="px-3 py-1.5 text-xs text-white/50 hover:text-white border border-white/8 hover:border-white/20 rounded-lg transition-colors">Import</button>
        <button onClick={handleExport} className="px-3 py-1.5 text-xs text-white/50 hover:text-white border border-white/8 hover:border-white/20 rounded-lg transition-colors">Export</button>
        <button onClick={handleReset} className="px-3 py-1.5 text-xs text-amber-400/70 hover:text-amber-400 border border-amber-500/20 hover:border-amber-500/40 rounded-lg transition-colors">Reset</button>
        <button onClick={() => setEditingCustom('new')} className="px-3 py-1.5 text-xs bg-vyro-600 hover:bg-vyro-500 text-white rounded-lg transition-colors">+ Add</button>
      </div>

      {}
      {statusMsg && (
        <div className="text-xs text-vyro-400 bg-vyro-500/10 border border-vyro-500/20 rounded-lg px-3 py-2">{statusMsg}</div>
      )}

      {}
      {editingCustom !== null && (
        <div className="border border-white/10 rounded-xl p-4 bg-white/3">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
            {editingCustom === 'new' ? 'New keyword' : `Edit "${(editingCustom as CustomKeyword).keyword}"`}
          </p>
          <KeywordForm
            initial={editingCustom === 'new' ? null : editingCustom as CustomKeyword}
            onSave={handleSaveCustom}
            onCancel={() => setEditingCustom(null)}
          />
        </div>
      )}

      {}
      <div className="flex gap-1 border-b border-white/8 pb-0">
        {(['builtin', 'custom'] as const).map(s => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={[
              'px-4 py-2 text-xs font-medium rounded-t-lg transition-colors',
              activeSection === s ? 'text-white bg-white/8 border-b-2 border-vyro-500' : 'text-white/40 hover:text-white/70',
            ].join(' ')}
          >
            {s === 'builtin' ? `Built-in (${filteredBuiltin.length})` : `Custom (${filteredCustom.length})`}
          </button>
        ))}
      </div>

      {}
      <div className="flex flex-col gap-0.5 max-h-72 overflow-y-auto pr-1">
        {loading ? (
          <p className="text-xs text-white/30 text-center py-8">Loading…</p>
        ) : activeSection === 'builtin' ? (
          filteredBuiltin.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-8">No built-in keywords match.</p>
          ) : filteredBuiltin.map(e => (
            <div key={e.keyword} className={rowCls}>
              {e.favicon ? (
                <img src={e.favicon} className="w-4 h-4 rounded-sm shrink-0 object-contain" alt="" onError={ev => { (ev.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-4 h-4 rounded-sm bg-white/10 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-sm text-white font-medium">{e.keyword}</span>
                {e.aliases.length > 0 && (
                  <span className="text-xs text-white/30 ml-2">{e.aliases.join(', ')}</span>
                )}
                <div className="text-xs text-white/30 truncate">{e.name}</div>
              </div>
              <span className={badgeCls}>{e.category}</span>
              <button
                onClick={() => handleToggleBuiltin(e.keyword, !e.enabled)}
                className={[
                  'w-8 h-4 rounded-full transition-colors shrink-0 relative',
                  e.enabled ? 'bg-vyro-600' : 'bg-white/15',
                ].join(' ')}
                title={e.enabled ? 'Disable' : 'Enable'}
              >
                <span className={[
                  'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all',
                  e.enabled ? 'left-4' : 'left-0.5',
                ].join(' ')} />
              </button>
            </div>
          ))
        ) : (
          filteredCustom.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-white/30 mb-2">No custom keywords yet.</p>
              <button onClick={() => setEditingCustom('new')} className="text-xs text-vyro-400 hover:text-vyro-300 transition-colors">+ Add your first keyword</button>
            </div>
          ) : filteredCustom.map(e => (
            <div key={e.keyword} className={rowCls}>
              {e.favicon ? (
                <img src={e.favicon} className="w-4 h-4 rounded-sm shrink-0 object-contain" alt="" onError={ev => { (ev.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-4 h-4 rounded-sm bg-white/10 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-sm text-white font-medium">{e.keyword}</span>
                {e.aliases.length > 0 && (
                  <span className="text-xs text-white/30 ml-2">{e.aliases.join(', ')}</span>
                )}
                <div className="text-xs text-white/30 truncate">{e.name}</div>
              </div>
              <span className={badgeCls}>{e.category}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingCustom(e)}
                  className="p-1 text-white/30 hover:text-white transition-colors rounded"
                  title="Edit"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteCustom(e.keyword)}
                  className="p-1 text-white/30 hover:text-red-400 transition-colors rounded"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => handleToggleCustom(e.keyword, !e.enabled)}
                className={[
                  'w-8 h-4 rounded-full transition-colors shrink-0 relative',
                  e.enabled ? 'bg-vyro-600' : 'bg-white/15',
                ].join(' ')}
                title={e.enabled ? 'Disable' : 'Enable'}
              >
                <span className={[
                  'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all',
                  e.enabled ? 'left-4' : 'left-0.5',
                ].join(' ')} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Small visual preview of a theme inside its selection card.
const ThemePreview: React.FC<{ variant: Theme }> = ({ variant }) => {
  const dark = { bg: '#17171b', bar: '#23232a', line: '#3a3a44', text: '#9ca3af' };
  const light = { bg: '#f5f5f7', bar: '#ffffff', line: '#d8d8de', text: '#6b7280' };
  if (variant === 'system') {
    return (
      <div className="h-16 rounded-lg overflow-hidden flex border border-black/10">
        <div className="flex-1 flex flex-col" style={{ background: light.bg }}>
          <div className="h-3 m-1 rounded" style={{ background: light.bar }} />
          <div className="h-1.5 mx-1 rounded" style={{ background: light.line }} />
        </div>
        <div className="flex-1 flex flex-col" style={{ background: dark.bg }}>
          <div className="h-3 m-1 rounded" style={{ background: dark.bar }} />
          <div className="h-1.5 mx-1 rounded" style={{ background: dark.line }} />
        </div>
      </div>
    );
  }
  const c = variant === 'dark' ? dark : light;
  return (
    <div className="h-16 rounded-lg overflow-hidden p-1.5 flex flex-col gap-1 border border-black/10" style={{ background: c.bg }}>
      <div className="h-3 rounded" style={{ background: c.bar }} />
      <div className="h-1.5 w-3/4 rounded" style={{ background: c.line }} />
      <div className="h-1.5 w-1/2 rounded" style={{ background: c.line }} />
    </div>
  );
};

const AppearanceTab: React.FC = () => {
  const theme = useSettingsStore(s => s.settings.theme);
  const accentColor = useSettingsStore(s => s.settings.accentColor);
  const updateSetting = useSettingsStore(s => s.updateSetting);

  const selectTheme = (t: Theme) => {
    // Apply instantly (store drives the document data-theme via useSettings) and persist.
    updateSetting('theme', t);
    ipc.invoke(IPC.SETTINGS_SET, { profileId: DEFAULT_PROFILE_ID, settings: { theme: t } });
  };

  const selectAccent = (c: string) => {
    updateSetting('accentColor', c);
    ipc.invoke(IPC.SETTINGS_SET, { profileId: DEFAULT_PROFILE_ID, settings: { accentColor: c } });
  };

  const OPTIONS: { id: Theme; label: string }[] = [
    { id: 'light', label: 'Light Mode' },
    { id: 'dark', label: 'Dark Mode' },
    { id: 'system', label: 'System Default' },
  ];

  return (
    <div className="flex flex-col gap-5 text-sm">
      <div className="bg-white/3 border border-white/8 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Theme</p>
        <div className="grid grid-cols-3 gap-3">
          {OPTIONS.map(o => (
            <button
              key={o.id}
              onClick={() => selectTheme(o.id)}
              aria-pressed={theme === o.id}
              className={`flex flex-col gap-2 p-2 rounded-xl border transition-all text-left ${
                theme === o.id
                  ? 'border-vyro-500 bg-vyro-500/10 ring-1 ring-vyro-500/40'
                  : 'border-white/8 hover:border-white/20 bg-white/3'
              }`}
            >
              <ThemePreview variant={o.id} />
              <span className={`text-xs font-medium ${theme === o.id ? 'text-white' : 'text-white/60'}`}>{o.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-white/25">System Default follows your OS appearance automatically.</p>
      </div>

      <div className="bg-white/3 border border-white/8 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Accent Color</p>
        <div className="flex items-center gap-3">
          {ACCENT_PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => selectAccent(p.value)}
              aria-label={p.name}
              aria-pressed={accentColor === p.value}
              title={p.name}
              className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                accentColor === p.value ? 'ring-2 ring-offset-2 ring-offset-transparent ring-white/70 scale-110' : ''
              }`}
              style={{ background: p.value }}
            />
          ))}
          <label className="ml-1 w-7 h-7 rounded-full border border-white/15 flex items-center justify-center cursor-pointer relative overflow-hidden" title="Custom color">
            <span className="text-white/50 text-sm">+</span>
            <input
              type="color"
              value={accentColor}
              onChange={e => selectAccent(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

const PrivacyTab: React.FC = () => {
  const [httpsOnly, setHttpsOnly] = useState(false);

  useEffect(() => {
    ipc.invoke(IPC.SETTINGS_GET, { profileId: DEFAULT_PROFILE_ID }).then((s: any) => {
      if (s && typeof s.httpsOnly === 'boolean') setHttpsOnly(s.httpsOnly);
    });
  }, []);

  const toggleHttpsOnly = () => {
    const next = !httpsOnly;
    setHttpsOnly(next);
    ipc.invoke(IPC.SETTINGS_SET, { profileId: DEFAULT_PROFILE_ID, settings: { httpsOnly: next } });
  };

  return (
    <div className="flex flex-col gap-5 text-sm">
      <div className="bg-white/3 border border-white/8 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Privacy &amp; Security</p>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-white/80">HTTPS-Only Mode</span>
            <span className="text-xs text-white/25">Upgrade page loads to HTTPS; insecure sites that can't upgrade will fail to load.</span>
          </div>
          <button
            role="switch"
            aria-checked={httpsOnly}
            aria-label="HTTPS-Only Mode"
            onClick={toggleHttpsOnly}
            className={`relative shrink-0 w-10 h-6 rounded-full transition-colors ${httpsOnly ? 'bg-vyro-500' : 'bg-white/12'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${httpsOnly ? 'translate-x-4' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

const AITab: React.FC = () => {
  const [ollamaUrl, setOllamaUrl] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [aiSystemPrompt, setAiSystemPrompt] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle');

  const checkOllama = useCallback(async () => {
    setStatus('checking');
    try {
      const list = await ipc.invoke<{ name: string }[]>(IPC.AI_MODELS_LIST);
      const names = (list ?? []).map(m => m.name);
      setModels(names);
      setStatus(names.length >= 0 ? 'online' : 'offline');
      // listModels resolves [] on connection error too; probe health to disambiguate.
      const ok = await ipc.invoke<{ running?: boolean } | boolean>(IPC.ONBOARDING_CHECK_OLLAMA).catch(() => false);
      const running = typeof ok === 'object' ? !!ok?.running : !!ok;
      setStatus(running ? 'online' : 'offline');
    } catch {
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    ipc.invoke(IPC.SETTINGS_GET, { profileId: DEFAULT_PROFILE_ID }).then((s: any) => {
      if (!s) return;
      if (typeof s.ollamaUrl === 'string') setOllamaUrl(s.ollamaUrl);
      if (typeof s.aiModel === 'string') setAiModel(s.aiModel);
      if (typeof s.aiSystemPrompt === 'string') setAiSystemPrompt(s.aiSystemPrompt);
    });
    checkOllama();
  }, [checkOllama]);

  const save = (partial: Record<string, unknown>) => {
    ipc.invoke(IPC.SETTINGS_SET, { profileId: DEFAULT_PROFILE_ID, settings: partial });
  };

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-vyro-500/50';

  const dot = status === 'online' ? 'bg-green-400' : status === 'offline' ? 'bg-red-400' : 'bg-white/30';
  const statusText = status === 'online' ? `Connected · ${models.length} model${models.length === 1 ? '' : 's'}`
    : status === 'offline' ? 'Not reachable — is Ollama running?'
    : status === 'checking' ? 'Checking…' : '';

  return (
    <div className="flex flex-col gap-5 text-sm">
      <div className="bg-white/3 border border-white/8 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Ollama</p>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dot} ${status === 'checking' ? 'animate-pulse' : ''}`} />
            <span className="text-xs text-white/50">{statusText}</span>
            <button onClick={checkOllama} className="text-xs text-vyro-400 hover:text-vyro-300 transition-colors">Test</button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Ollama Server URL</label>
          <input
            className={inputCls}
            value={ollamaUrl}
            onChange={e => setOllamaUrl(e.target.value)}
            onBlur={() => { save({ ollamaUrl }); checkOllama(); }}
            placeholder="http://localhost:11434"
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Default Model</label>
          {models.length > 0 ? (
            <select
              className={inputCls}
              value={models.includes(aiModel) ? aiModel : ''}
              onChange={e => { setAiModel(e.target.value); save({ aiModel: e.target.value }); }}
            >
              <option value="" disabled>Select a model…</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          ) : (
            <input
              className={inputCls}
              value={aiModel}
              onChange={e => setAiModel(e.target.value)}
              onBlur={() => save({ aiModel })}
              placeholder="e.g. llama3.2  (run: ollama pull llama3.2)"
            />
          )}
        </div>
      </div>
      <div className="bg-white/3 border border-white/8 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Assistant</p>
        <div>
          <label className="block text-xs text-white/40 mb-1">System Prompt</label>
          <textarea
            className={`${inputCls} min-h-[88px] resize-y`}
            value={aiSystemPrompt}
            onChange={e => setAiSystemPrompt(e.target.value)}
            onBlur={() => save({ aiSystemPrompt })}
            placeholder="You are a helpful browser assistant. Be concise and clear."
          />
        </div>
      </div>
    </div>
  );
};

const GeneralTab: React.FC = () => {
  const [cacheSize, setCacheSize] = useState<string | null>(null);
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const searchEngine = useSettingsStore(s => s.settings.searchEngine);
  const setSettings = useSettingsStore(s => s.setSettings);
  const updateSetting = useSettingsStore(s => s.updateSetting);

  useEffect(() => {
    ipc.invoke(IPC.APP_GET_CACHE_SIZE).then((r: any) => setCacheSize(r?.mb ?? null));
    ipc.invoke(IPC.APP_GET_VERSION).then((r: any) => setVersionInfo(r));
  }, []);

  const selectEngine = (e: SearchEngine) => {
    updateSetting('searchEngine', e);
    ipc.invoke(IPC.SETTINGS_SET, { profileId: DEFAULT_PROFILE_ID, settings: { searchEngine: e } });
  };

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2500); };

  const resetDefaults = async () => {
    if (!window.confirm('Reset all settings to their defaults? Your bookmarks, history, and AI chats are kept.')) return;
    setSettings(DEFAULT_SETTINGS);
    await ipc.invoke(IPC.SETTINGS_SET, { profileId: DEFAULT_PROFILE_ID, settings: DEFAULT_SETTINGS });
    flash('Settings reset to defaults.');
  };

  const exportSettings = async () => {
    const s = await ipc.invoke<AppSettings>(IPC.SETTINGS_GET, { profileId: DEFAULT_PROFILE_ID });
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vyro-settings.json';
    a.click();
    flash('Settings exported.');
  };

  const importSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        const merged = { ...DEFAULT_SETTINGS, ...parsed } as AppSettings;
        setSettings(merged);
        await ipc.invoke(IPC.SETTINGS_SET, { profileId: DEFAULT_PROFILE_ID, settings: merged });
        flash('Settings imported.');
      } catch {
        flash('Error: invalid settings file.');
      }
    };
    input.click();
  };

  const run = async (channel: string, label: string, confirm?: string) => {
    if (confirm && !window.confirm(confirm)) return;
    setBusy(label);
    setMsg(null);
    const r: any = await ipc.invoke(channel as any);
    setBusy(null);
    if (r?.ok === false) {
      setMsg(`Error: ${r.error ?? 'unknown'}`);
    } else if (channel !== IPC.APP_RESET) {
      setMsg(`${label} complete.`);
      if (channel === IPC.APP_CLEAR_CACHE || channel === IPC.APP_CLEAR_GPU_CACHE) {
        ipc.invoke(IPC.APP_GET_CACHE_SIZE).then((r2: any) => setCacheSize(r2?.mb ?? null));
      }
    }
  };

  const btnCls = (color: string) =>
    `flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all disabled:opacity-40 ${color}`;

  return (
    <div className="flex flex-col gap-5 text-sm">
      {}
      <div className="bg-white/3 border border-white/8 rounded-xl p-4 flex flex-col gap-1">
        <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1">About</p>
        {versionInfo ? (
          <>
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Version</span>
              <span className="text-white font-mono">{versionInfo.version}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Electron</span>
              <span className="text-white/70 font-mono">{versionInfo.electron}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Chrome</span>
              <span className="text-white/70 font-mono">{versionInfo.chrome}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Platform</span>
              <span className="text-white/70 font-mono">{versionInfo.platform} / {versionInfo.arch}</span>
            </div>
          </>
        ) : (
          <p className="text-white/20 text-xs">Loading…</p>
        )}
      </div>

      {}
      <div className="bg-white/3 border border-white/8 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Default Search Engine</p>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(SEARCH_ENGINES) as SearchEngine[]).map(e => (
            <button
              key={e}
              onClick={() => selectEngine(e)}
              aria-pressed={searchEngine === e}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                searchEngine === e ? 'bg-vyro-500 text-white' : 'bg-white/6 hover:bg-white/10 text-white/80'
              }`}
            >
              {SEARCH_ENGINES[e].label}
            </button>
          ))}
        </div>
      </div>

      {}
      <div className="bg-white/3 border border-white/8 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Settings</p>
        <div className="flex gap-2">
          <button className={btnCls('bg-white/6 hover:bg-white/10 text-white/80')} onClick={importSettings}>Import…</button>
          <button className={btnCls('bg-white/6 hover:bg-white/10 text-white/80')} onClick={exportSettings}>Export</button>
          <button className={btnCls('bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20')} onClick={resetDefaults}>Reset to Defaults</button>
        </div>
        <p className="text-xs text-white/25">Back up or restore your preferences as a JSON file.</p>
      </div>

      {}
      <div className="bg-white/3 border border-white/8 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Cache</p>
          {cacheSize !== null && (
            <span className="text-xs text-white/50 font-mono">{cacheSize} MB used</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            className={btnCls('bg-white/6 hover:bg-white/10 text-white/80')}
            disabled={!!busy}
            onClick={() => run(IPC.APP_CLEAR_CACHE, 'Clear Cache')}
          >
            {busy === 'Clear Cache' ? 'Clearing…' : 'Clear Browser Cache'}
          </button>
          <button
            className={btnCls('bg-white/6 hover:bg-white/10 text-white/80')}
            disabled={!!busy}
            onClick={() => run(IPC.APP_CLEAR_GPU_CACHE, 'Clear GPU Cache')}
          >
            {busy === 'Clear GPU Cache' ? 'Clearing…' : 'Clear GPU Cache'}
          </button>
        </div>
        <p className="text-xs text-white/25">Clears cached pages and GPU shaders. Your browsing data is kept.</p>
      </div>

      {}
      <div className="bg-white/3 border border-white/8 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Reset</p>
        <div className="flex gap-2">
          <button
            className={btnCls('bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20')}
            disabled={!!busy}
            onClick={() => run(
              IPC.APP_RESET,
              'Reset Vyro',
              'This will clear all cookies, sessions, and cached data. Your bookmarks and history are preserved. Vyro will restart. Continue?'
            )}
          >
            {busy === 'Reset Vyro' ? 'Resetting…' : 'Reset Vyro'}
          </button>
        </div>
        <p className="text-xs text-white/25">Clears all sessions and cache. Keeps bookmarks, history, and AI conversations. App will restart.</p>
      </div>

      {msg && (
        <p className={`text-xs px-3 py-2 rounded-lg ${msg.startsWith('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
          {msg}
        </p>
      )}
    </div>
  );
};

const TABS: { id: Tab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'ai', label: 'AI' },
  // Keywords stays defined so it is trivial to re-enable; hidden via the flag.
  ...(KEYWORDS_TAB_ENABLED ? [{ id: 'keywords' as Tab, label: 'Keywords' }] : []),
];

export const SettingsModal: React.FC = () => {
  const closeModal = useUiStore(s => s.closeModal);
  const [activeTab, setActiveTab] = useState<Tab>('general');

  return (
    <Modal open title="Settings" onClose={closeModal} width="max-w-2xl">
      <div className="flex gap-1 mb-5 border-b border-white/8 -mt-1 pb-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={[
              'px-4 py-2 text-xs font-medium rounded-t-lg transition-colors',
              activeTab === t.id ? 'text-white bg-white/8 border-b-2 border-vyro-500' : 'text-white/40 hover:text-white/70',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>
      {activeTab === 'general' && <GeneralTab />}
      {activeTab === 'appearance' && <AppearanceTab />}
      {activeTab === 'privacy' && <PrivacyTab />}
      {activeTab === 'ai' && <AITab />}
      {KEYWORDS_TAB_ENABLED && activeTab === 'keywords' && <KeywordsTab />}
    </Modal>
  );
};
