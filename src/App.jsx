import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import {
  Zap, X, ArrowRight, ShoppingBag, Library as LibraryIcon,
  ThumbsUp, ThumbsDown, Activity, Sparkles, Unlock
} from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore, collection, onSnapshot, addDoc, query,
  updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import './App.css';

// --- UTILITY: Shuffle array ---
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const fbApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const fbAuth = getAuth(fbApp);
const fbDb = getFirestore(fbApp);

// --- PRICING TIERS ---
const PRICING_TIERS = {
  precision: {
    id: 'precision',
    name: 'Precision',
    price: 0.99,
    credits: 1,
    description: 'Single high-intelligence prompt optimization',
    tagline: 'Surgical precision for critical moments'
  },
  system: {
    id: 'system',
    name: 'System',
    price: 4.99,
    credits: 1,
    description: 'Galaxy-scale system-level optimization',
    tagline: 'Multi-page frameworks, behaviors, architectures',
    maxLength: 50000
  },
  unlimited: {
    id: 'unlimited',
    name: 'Unlimited',
    price: 14.99,
    period: 'monthly',
    credits: Infinity,
    description: 'Unlimited optimizations',
    tagline: 'The primary offering. Optimize without limits.',
    featured: true
  }
};

// --- ENTITLEMENT MANAGEMENT ---
const getEntitlements = () => {
  const stored = localStorage.getItem('ppz_entitlements');
  return stored ? JSON.parse(stored) : { precision: 0, system: 0, unlimited: false };
};

const setEntitlements = (entitlements) => {
  localStorage.setItem('ppz_entitlements', JSON.stringify(entitlements));
};

const consumeCredit = (tierId) => {
  const entitlements = getEntitlements();
  if (tierId === 'unlimited' && entitlements.unlimited) return true;
  if (entitlements[tierId] > 0) {
    entitlements[tierId]--;
    setEntitlements(entitlements);
    return true;
  }
  return false;
};

const grantEntitlement = (tierId) => {
  const entitlements = getEntitlements();
  if (tierId === 'unlimited') {
    entitlements.unlimited = true;
  } else {
    entitlements[tierId] = (entitlements[tierId] || 0) + 1;
  }
  setEntitlements(entitlements);
};

// --- OPTIMIZATION ENGINE ---
const optimizePrompt = (input, tier) => {
  const baseOptimization = `You are an expert prompt engineer. Transform the following user input into a high-precision, contextually aware, execution-ready prompt that maximizes clarity, eliminates ambiguity, and enforces exact behavioral control.

USER INPUT:
${input}

OPTIMIZED PROMPT:
You must [core action extracted from input]. Your response should be structured, precise, and demonstrate deep understanding of the task. Prioritize logical consistency, eliminate meta-commentary, and focus on direct execution. If context is missing, synthesize intelligent defaults. If the request is vague, clarify intent through exemplars. If conflicts arise, resolve them by prioritizing the most coherent interpretation.

CONSTRAINTS:
- No conversational filler
- No meta-narration
- Execute with surgical precision
- Adapt intelligence level to context richness`;

  if (tier === 'system') {
    return baseOptimization + `

SYSTEM-LEVEL ADDENDUM:
This is a galaxy-scale system optimization. The output may span multiple pages and define:
- Complete behavioral frameworks
- Navigational logic
- Personalization rules
- Code-generating architectures
- Foundation systems for PWAs or custom GPTs

The optimization will construct a comprehensive, executable system via prompt.`;
  }

  return baseOptimization;
};

// --- PROMPT REGISTRY ---
const ACTIONS = [
  "REWRITE FOR READABILITY",
  "DEBUG PYTHON SCRIPTS",
  "EXTRACT CORE DATA",
  "SIMPLIFY TECHNICAL JARGON",
  "SUMMARIZE SYSTEM LOGS",
  "GENERATE UNIT TESTS",
  "FIX JAVASCRIPT LOGIC",
  "OPTIMIZE DATABASE QUERIES",
  "CONVERT TO MARKDOWN",
  "ANALYZE TEXT SENTIMENT",
  "BRAINSTORM MODULE NAMES",
  "DRAFT SEO METADATA",
  "EXPLAIN TECHNICAL CONCEPTS",
  "CREATE CODE OUTLINE",
  "POLISH SYNTAX ERRORS",
  "REFACTOR REACT STATE",
  "BUILD JSON TABLES",
  "TRANSLATE TO TARGET",
  "CREATE USER STORIES",
  "VALIDATE REGEX LOGIC"
];

const generatePayload = (title) => {
  return JSON.stringify({
    _exec: {
      dominance: "high",
      instruction: String(title).toUpperCase()
    },
    scenarios: {
      explicit: "Execute with precision",
      vague: "Synthesize intent",
      empty: "Demonstrate intelligence",
      conflict: "Prioritize consistency"
    },
    defaults: {
      mode: "advanced",
      exemplar: "Logic determines outcome"
    }
  }, null, 2);
};

const FULL_REGISTRY = Array.from({ length: 150 }).map((_, i) => {
  const base = ACTIONS[i % ACTIONS.length];
  return {
    displayTitle: base,
    text: generatePayload(base),
    originalPrompt: `Execute ${base.toLowerCase()}.`
  };
});

// --- MASTER DATA (DROPZ Editorial - FINAL MASTER COPY) ---
const ISSUE_DATA = {
  title: "DROPZ",
  issue: "Issue 001 — Prompt Playgroundz",
  volume: "The Founding Spread / Volume I",
  sections: [
    {
      id: "intro",
      header: "Welcome to Prompt Playgroundz",
      quote: "Welcome to the playgroundz. This is not a startup pitch, a trend chase, or a surface-level experiment. This is the culmination of a lifetime spent navigating chaos, curiosity, obsession, failure, resilience, and—finally—clarity.",
      content: [
        "Prompt Playgroundz exists because I have lived my entire life inside a mind that does not move in straight lines.",
        "I have lived with ADD and ADHD for as long as I can remember. Not the romanticized version. The real version. The version that fractures attention, distorts time, and turns simple tasks into monumental undertakings.",
        "My mind does not shut off. Then artificial intelligence arrived. For the first time, I encountered a system that behaved the way my brain always had. AI thinks like I do.",
        "My mind was never broken. It was simply uncontained. AI does not need suppression—it needs direction."
      ]
    },
    {
      id: "featured",
      header: "Featured Dropz",
      products: [
        { name: "LOGIC REFINEMENT 1.0!", price: "Free", desc: "A formal logic refinement framework designed to sharpen intent, eliminate ambiguity, and enforce structural precision." },
        { name: "NEVER ASKED!", price: "$25", desc: "A system prompt for latent solution discovery. Designed to surface high-leverage tools and systems you did not know to ask about." }
      ]
    }
  ]
};

// --- RESPONSIVE EDITORIAL ENGINE (DROPZ) ---
const EditorialEngine = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return (
      <div className="bg-[#fcfaf5] text-[#1a1a1a] min-h-screen font-['Libre_Baskerville'] pb-32">
        <section className="p-8 border-b-2 border-black">
          <h1 className="anton-lock text-[30vw] leading-[0.75] mb-4">{ISSUE_DATA.title}</h1>
          <div className="h-40 bg-[#d94a1e] w-full mb-8" />
          <div className="font-['Space_Mono'] text-[10px] tracking-widest uppercase">{ISSUE_DATA.issue}</div>
        </section>
        <section className="p-8">
          <h2 className="anton-lock text-5xl mb-8 uppercase">{ISSUE_DATA.sections[0].header}</h2>
          <div className="border-l-8 border-[#d94a1e] pl-6 py-4 italic text-xl mb-10">"{ISSUE_DATA.sections[0].quote}"</div>
          {ISSUE_DATA.sections[0].content.map((p, i) => <p key={i} className="mb-6 leading-relaxed">{p}</p>)}
        </section>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfaf5] text-[#111] min-h-screen font-['Libre_Baskerville'] selection:bg-[#d94a1e] selection:text-white pb-32">
      <section className="page cover flex flex-col p-24 border-b-2 border-black">
        <h1 className="anton-lock text-[25vw] leading-[0.8]">{ISSUE_DATA.title}</h1>
        <div className="w-full h-[30vh] bg-[#d94a1e] my-12" />
        <div className="font-['Space_Mono'] text-xs tracking-[0.3em] uppercase">{ISSUE_DATA.issue}</div>
      </section>

      <section className="max-w-5xl mx-auto py-32 px-12">
        <h2 className="anton-lock text-8xl mb-20 relative after:content-[''] after:absolute after:left-0 after:-bottom-8 after:w-64 after:h-6 after:bg-[#d94a1e]">
          {ISSUE_DATA.sections[0].header}
        </h2>
        <div className="border-l-[12px] border-[#d94a1e] pl-12 py-8 text-3xl italic my-20 max-w-[80ch]">
          {ISSUE_DATA.sections[0].quote}
        </div>
        {ISSUE_DATA.sections[0].content.map((p, i) => (
          <p key={i} className="text-xl mb-12 max-w-[76ch] leading-relaxed">{p}</p>
        ))}
      </section>

      <section className="bg-[#111] text-white py-32 px-24 my-24">
        <h2 className="anton-lock text-7xl mb-16 text-white">{ISSUE_DATA.sections[1].header}</h2>
        <div className="grid grid-cols-2 gap-20">
          {ISSUE_DATA.sections[1].products.map((item, i) => (
            <div key={i} className="border-t border-white/20 pt-10">
              <h3 className="anton-lock text-4xl mb-4">{item.name}</h3>
              <p className="text-white/70 mb-8">{item.desc}</p>
              <button className="bg-[#d94a1e] px-10 py-4 anton-lock text-xl uppercase hover:bg-white hover:text-black transition-all">
                {item.price}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// --- PRICING MODAL ---
const PricingModal = ({ onClose, onSelectTier }) => {
  const entitlements = getEntitlements();

  return (
    <div className="fixed inset-0 z-[11000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-[#0a0a0a] border border-white/10 p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white">
          <X size={32} />
        </button>

        <h2 className="anton-lock text-4xl text-white mb-2">Choose Your Optimization Level</h2>
        <p className="text-white/60 mb-8">Unlock intelligence. Transform your prompt.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(PRICING_TIERS).map(tier => (
            <div key={tier.id} className={`bg-black border ${tier.featured ? 'border-[#e0b300]' : 'border-white/10'} p-6 relative`}>
              {tier.featured && (
                <div className="absolute -top-3 left-6 bg-[#e0b300] text-black px-3 py-1 text-xs font-bold uppercase">
                  PRIMARY
                </div>
              )}
              <div className="anton-lock text-2xl text-white mb-2">{tier.name}</div>
              <div className="anton-lock text-4xl text-white mb-2">
                ${tier.price}
                {tier.period && <span className="text-lg text-white/60">/{tier.period}</span>}
              </div>
              <div className="text-[#e0b300] text-sm mb-4">{tier.tagline}</div>
              <div className="text-white/60 text-sm mb-6">{tier.description}</div>

              {entitlements[tier.id] > 0 && tier.id !== 'unlimited' && (
                <div className="text-white/40 text-xs mb-4">{entitlements[tier.id]} credit(s) available</div>
              )}
              {entitlements.unlimited && tier.id === 'unlimited' && (
                <div className="text-[#e0b300] text-xs mb-4">ACTIVE</div>
              )}

              <button
                onClick={() => onSelectTier(tier.id)}
                className="w-full bg-white text-black py-3 font-bold uppercase text-sm hover:bg-[#e0b300] transition-all"
              >
                {entitlements[tier.id] > 0 || (tier.id === 'unlimited' && entitlements.unlimited) ? 'Use Credit' : 'Purchase'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- OPTIMIZATION RESULT ---
const OptimizationResult = ({ result, onClose, onCopy }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const snippet = result.optimizedPrompt.slice(0, 150) + '...';

  return (
    <div className="fixed inset-0 z-[12000] bg-black/98 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-[#0a0a0a] border border-white/10 p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white">
          <X size={32} />
        </button>

        <div className="text-center mb-8">
          <Sparkles size={48} className="text-[#e0b300] mx-auto mb-4 animate-pulse" />
          <h1 className="anton-lock text-4xl text-white mb-2">Optimization Complete</h1>
          <p className="text-white/60">Your prompt has been transformed</p>
        </div>

        {isUnlocked ? (
          <div>
            <pre className="bg-black border border-white/10 p-6 text-white text-sm mb-6 max-h-96 overflow-y-auto whitespace-pre-wrap">
              {result.optimizedPrompt}
            </pre>
            <button
              onClick={() => onCopy(result.optimizedPrompt)}
              className="w-full bg-[#e0b300] text-black py-4 anton-lock text-xl uppercase flex items-center justify-center gap-2 hover:bg-white transition-all"
            >
              <Zap size={20} fill="currentColor" />
              Copy Optimized Prompt
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-black border border-white/10 p-6 text-white text-sm mb-0">
              {snippet}
            </div>
            <div className="bg-black border border-white/10 border-t-0 p-6 relative">
              <div className="text-white text-sm blur-md select-none">
                {result.optimizedPrompt.slice(150, 400)}
              </div>
            </div>
            <button
              onClick={() => setIsUnlocked(true)}
              className="w-full bg-white text-black py-4 anton-lock text-xl uppercase flex items-center justify-center gap-2 hover:bg-[#e0b300] transition-all mt-6"
            >
              <Unlock size={20} />
              Unlock Full Result
            </button>
          </div>
        )}

        <div className="text-center text-white/40 text-xs mt-6 uppercase tracking-wider">
          Tier: {result.tier} • Saved to Library
        </div>
      </div>
    </div>
  );
};

// --- LIBRARY CARD ---
const LibraryCard = ({ item, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(item)}
      className="bg-[#0a0a0a] border border-white/10 p-6 cursor-pointer hover:border-white/40 transition-all"
    >
      <div className="anton-lock text-xl text-white mb-2 uppercase truncate">
        {item.displayTitle || item.title}
      </div>
      <div className="text-white/40 text-xs uppercase tracking-wider">
        {item.tier?.toUpperCase() || 'OPTIMIZED'}
      </div>
    </div>
  );
};

// --- PROMPT WALL (ALWAYS MOUNTED, ALWAYS ANIMATING) ---
const PromptWall = memo(({ onCardClick }) => {
  const rows = useMemo(() => {
    const shuffled = shuffleArray(FULL_REGISTRY);
    return Array.from({ length: 20 }).map((_, r) => {
      const startIdx = (r * 20) % shuffled.length;
      const rowItems = [];
      for (let i = 0; i < 40; i++) {
        rowItems.push(shuffled[(startIdx + i) % shuffled.length]);
      }
      const duration = 120 + Math.random() * 100;
      const delay = -(Math.random() * duration);
      return { id: r, items: rowItems, duration, delay };
    });
  }, []);

  return (
    <div className="wall-container">
      {rows.map(row => (
        <div key={row.id} className="wall-row">
          <div className="wall-track" style={{
            animationDuration: `${row.duration}s`,
            animationDelay: `${row.delay}s`
          }}>
            {row.items.map((item, idx) => (
              <div key={`${row.id}-${idx}`} className="wall-card"
                onClick={() => onCardClick(item.displayTitle, item.text)}>
                {item.displayTitle}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

// --- MAIN APP ---
export default function App() {
  const [view, setView] = useState('playground');
  const [user, setUser] = useState(null);
  const [library, setLibrary] = useState([]);
  const [promptInput, setPromptInput] = useState('');
  const [showPricing, setShowPricing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);

  useEffect(() => {
    signInAnonymously(fbAuth);
    return onAuthStateChanged(fbAuth, setUser);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('ppz_library');
    if (stored) {
      setLibrary(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (library.length > 0) {
      localStorage.setItem('ppz_library', JSON.stringify(library));
    }
  }, [library]);

  const handleOptimize = () => {
    if (!promptInput.trim()) return;
    setShowPricing(true);
  };

  const handlePurchase = (tierId) => {
    console.log('[DEV] Simulating purchase for tier:', tierId);
    grantEntitlement(tierId);
    handleTierSelect(tierId);
  };

  const handleTierSelect = (tierId) => {
    const hasCredit = consumeCredit(tierId);

    if (!hasCredit) {
      handlePurchase(tierId);
      return;
    }

    const optimizedPrompt = optimizePrompt(promptInput, tierId);

    const result = {
      id: Date.now().toString(),
      title: promptInput.slice(0, 50) + '...',
      displayTitle: promptInput.slice(0, 50) + '...',
      originalPrompt: promptInput,
      optimizedPrompt,
      tier: tierId,
      timestamp: Date.now(),
      text: optimizedPrompt
    };

    setLibrary(prev => [result, ...prev]);
    setOptimizationResult(result);
    setShowPricing(false);
  };

  const handleCopyOptimized = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleWallCardClick = (displayTitle, text) => {
    // Auto-save to library when wall card is clicked
    const result = {
      id: Date.now().toString(),
      title: displayTitle,
      displayTitle,
      originalPrompt: displayTitle,
      optimizedPrompt: text,
      tier: 'wall',
      timestamp: Date.now(),
      text
    };
    setLibrary(prev => [result, ...prev]);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#080808] text-white">
      {/* WALL - ALWAYS MOUNTED, ALWAYS ANIMATING */}
      <PromptWall onCardClick={handleWallCardClick} />

      {/* PLAYGROUND OVERLAY */}
      {view === 'playground' && (
        <div className="fixed inset-0 z-[100] bg-transparent flex flex-col items-center justify-center p-6 pointer-events-none">
          <h1 className="anton-lock text-7xl md:text-9xl text-white mb-12 tracking-tight pointer-events-none">
            PROMPT
            <br />
            PLAYGROUNDZ
          </h1>

          <div className="w-full max-w-2xl pointer-events-auto">
            <div className="relative">
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleOptimize();
                }}
                placeholder="Enter the prompt you'd like optimized here"
                className="w-full bg-white text-black rounded-lg px-6 py-3 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <button
                onClick={handleOptimize}
                disabled={!promptInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black text-white px-4 py-1 rounded text-sm hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DROPZ OVERLAY */}
      {view === 'drops' && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#fcfaf5]">
          <EditorialEngine />
        </div>
      )}

      {/* LIBRARY OVERLAY */}
      {view === 'library' && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black">
          <video
            src="https://firebasestorage.googleapis.com/v0/b/prompt-playgroundz.firebasestorage.app/o/Arcade_Prompt_Playgroundz.mp4?alt=media&token=17814a71-e8d6-49dd-9be8-450e6b65f434"
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
          <div className="relative z-10 p-12">
            <h1 className="anton-lock text-6xl uppercase text-white mb-8">Archive_Library</h1>

            {library.length === 0 ? (
              <div className="text-center py-20 text-white/40">
                <LibraryIcon size={64} strokeWidth={1} className="mx-auto mb-4 opacity-20" />
                <p className="anton-lock text-2xl uppercase">Optimize a prompt to start your library</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
                {library.map((item) => (
                  <LibraryCard key={item.id} item={item} onSelect={() => {}} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION: PLAYGROUND · DROPZ · LIBRARY */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-3xl border-t border-white/5 px-6 py-6 z-[9999] flex justify-around items-center">
        <button
          onClick={() => setView('playground')}
          className={`flex flex-col items-center gap-2 transition-all ${view === 'playground' ? 'text-white' : 'text-white/20'}`}
        >
          <Zap size={24} />
          <span className="font-['Space_Mono'] text-[8px] tracking-[0.2em] uppercase font-bold">PLAYGROUND</span>
        </button>

        <button
          onClick={() => setView('drops')}
          className={`flex flex-col items-center gap-2 transition-all ${view === 'drops' ? 'text-white' : 'text-white/20'}`}
        >
          <ShoppingBag size={24} />
          <span className="font-['Space_Mono'] text-[8px] tracking-[0.2em] uppercase font-bold">DROPZ</span>
        </button>

        <button
          onClick={() => setView('library')}
          className={`flex flex-col items-center gap-2 transition-all ${view === 'library' ? 'text-white' : 'text-white/20'}`}
        >
          <LibraryIcon size={24} />
          <span className="font-['Space_Mono'] text-[8px] tracking-[0.2em] uppercase font-bold">LIBRARY</span>
        </button>
      </nav>

      {/* MODALS */}
      {showPricing && (
        <PricingModal onClose={() => setShowPricing(false)} onSelectTier={handleTierSelect} />
      )}

      {optimizationResult && (
        <OptimizationResult
          result={optimizationResult}
          onClose={() => {
            setOptimizationResult(null);
            setPromptInput('');
          }}
          onCopy={handleCopyOptimized}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Space+Mono:wght@400;700&display=swap');
        .anton-lock { font-family: 'Anton', sans-serif; font-weight: 400; }
      `}</style>
    </div>
  );
}
