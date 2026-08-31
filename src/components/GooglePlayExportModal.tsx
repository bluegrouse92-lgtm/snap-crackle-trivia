import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Terminal,
  ExternalLink,
  Shield,
  Layers,
  X,
  FileCode,
  Package,
} from 'lucide-react';

interface GooglePlayExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GooglePlayExportModal: React.FC<GooglePlayExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'bubblewrap' | 'capacitor' | 'checklist'>('bubblewrap');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const bubblewrapCommands = `# 1. Install Google Bubblewrap CLI (Official Trusted Web Activity tool for Google Play)
npm install -g @bubblewrap/cli

# 2. Initialize project from your live Web Manifest
bubblewrap init --manifest=${currentOrigin}/manifest.json

# 3. Build your Google Play Android App Bundle (.aab) & APK
bubblewrap build

# The output .aab is ready to upload directly to Google Play Console!`;

  const capacitorCommands = `# 1. Export the project ZIP from AI Studio Settings or git clone
npm install

# 2. Install Capacitor core & Android runtime
npm install @capacitor/core @capacitor/cli @capacitor/android

# 3. Initialize your Android package
npx cap init "PersonaTrivia AI" "com.personatrivia.app" --web-dir=dist

# 4. Build Vite production bundle and sync Android platform
npm run build
npx cap add android
npx cap sync android

# 5. Open in Android Studio to sign and generate Google Play .aab
npx cap open android`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-purple-500/10 text-white my-8"
        >
          {/* Header Banner */}
          <div className="relative p-6 bg-gradient-to-r from-emerald-600/20 via-purple-600/20 to-blue-600/20 border-b border-slate-800 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Export to Google Play Store</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono uppercase">
                    PWA / TWA Ready
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Package and publish PersonaTrivia AI to Android devices & Google Play Console
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Configuration Status Indicators */}
          <div className="grid grid-cols-3 gap-2 p-4 bg-slate-950/60 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Web Manifest</span>
                <span className="font-semibold text-slate-200">manifest.json</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">App Icons</span>
                <span className="font-semibold text-slate-200">192px & 512px SVG</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Service Worker</span>
                <span className="font-semibold text-slate-200">sw.js Registered</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 px-6 pt-3 gap-2">
            <button
              onClick={() => setActiveTab('bubblewrap')}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'bubblewrap'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Method 1: Google Bubblewrap (Recommended)</span>
            </button>

            <button
              onClick={() => setActiveTab('capacitor')}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'capacitor'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Method 2: Capacitor Native</span>
            </button>

            <button
              onClick={() => setActiveTab('checklist')}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'checklist'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Play Console Checklist</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 space-y-4">
            {activeTab === 'bubblewrap' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 text-xs text-slate-300 space-y-1.5">
                  <p className="font-semibold text-slate-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Official Google Trusted Web Activity (TWA) Pipeline</span>
                  </p>
                  <p className="text-slate-400">
                    Bubblewrap is Google's official CLI that reads your app's live Web Manifest and automatically compiles a signed Android App Bundle (<code className="text-amber-300 font-mono">.aab</code>) for Google Play.
                  </p>
                </div>

                <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto">
                  <button
                    onClick={() => copyToClipboard(bubblewrapCommands, 'bubblewrap')}
                    className="absolute top-3 right-3 py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    {copiedKey === 'bubblewrap' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Commands</span>
                      </>
                    )}
                  </button>
                  <pre className="text-emerald-400/90 whitespace-pre-wrap">{bubblewrapCommands}</pre>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>Manifest URL: <code className="text-purple-300 font-mono">{currentOrigin}/manifest.json</code></span>
                  <a
                    href="https://developer.chrome.com/docs/android/trusted-web-activity/quick-start"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>Google TWA Docs</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {activeTab === 'capacitor' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 text-xs text-slate-300 space-y-1.5">
                  <p className="font-semibold text-slate-100 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Capacitor Native Android Studio Project</span>
                  </p>
                  <p className="text-slate-400">
                    Export your project as a ZIP from the top AI Studio settings menu, then wrap it with Capacitor to generate full native Android source code ready for Android Studio.
                  </p>
                </div>

                <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto">
                  <button
                    onClick={() => copyToClipboard(capacitorCommands, 'capacitor')}
                    className="absolute top-3 right-3 py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    {copiedKey === 'capacitor' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Commands</span>
                      </>
                    )}
                  </button>
                  <pre className="text-purple-300/90 whitespace-pre-wrap">{capacitorCommands}</pre>
                </div>
              </div>
            )}

            {activeTab === 'checklist' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300 font-medium">
                  Complete these standard steps on <a href="https://play.google.com/console" target="_blank" rel="noreferrer" className="text-emerald-400 underline">Google Play Console</a>:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                    <div>
                      <span className="font-semibold text-slate-100 block">Create App in Google Play Console</span>
                      <span className="text-slate-400">Set title to "PersonaTrivia AI", select Category: Game &gt; Trivia.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                    <div>
                      <span className="font-semibold text-slate-100 block">Upload App Bundle (.aab)</span>
                      <span className="text-slate-400">Drag and drop the generated <code className="text-amber-300 font-mono">app-release-bundle.aab</code> into Production or Closed Testing.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                    <div>
                      <span className="font-semibold text-slate-100 block">Store Listing Assets</span>
                      <span className="text-slate-400">Upload 512x512 App Icon, 1024x500 Feature Graphic, and screenshots.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">4</span>
                    <div>
                      <span className="font-semibold text-slate-100 block">Digital Asset Links (TWA)</span>
                      <span className="text-slate-400">Place SHA-256 fingerprint in <code className="text-purple-300 font-mono">.well-known/assetlinks.json</code> to remove the browser address bar.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Export source ZIP anytime via the top right AI Studio menu.
            </span>
            <button
              onClick={onClose}
              className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
