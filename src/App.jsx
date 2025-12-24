import React, { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import {
  Zap,
  X,
  ThumbsUp,
  ThumbsDown,
  Info,
  Library as LibraryIcon,
  Activity,
  ShoppingBag,
  Sun,
  Moon,
  Lock,
  Unlock,
  ArrowRight,
  Play,
  Sparkles
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  addDoc,
  query,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { initializeFirebase, getFirebaseDb } from './firebase';
import { queueWrite, setupOfflineSync } from './offlineQueue';
import { copyToClipboard, cleanPayload, isOnline, shuffleArray } from './utils';
import './App.css';

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
    internalId: `TECH.${i % 3 === 0 ? "START" : i % 3 === 1 ? "MID" : "END"}.v${(i % 5) + 1}`,
    name: `INST_${i.toString(16).toUpperCase()}`,
    text: generatePayload(base),
    originalPrompt: `Execute ${base.toLowerCase()}.`,
    usagePhase: [i % 3 === 0 ? "start" : i % 3 === 1 ? "midflow" : "end"],
    behaviorProfile: {
      no_context: "demonstrate intelligence",
      light_context: "organize & clarify",
      rich_context: "amplify internal logic"
    },
    comment: "A high-fidelity literal technical instrument designed for exact behavioral control."
  };
});

// --- PRICING TIERS (LOCKED) ---
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

// --- COMPONENTS ---

const Seesaw = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="3" y1="18" x2="21" y2="10" />
    <path d="M12 14l-3 6h6z" />
  </svg>
);

const GlitchText = memo(({ text, isActive, speed = 40 }) => {
  const elRef = useRef(null);
  const rawText = String(text);

  useEffect(() => {
    if (!isActive || !elRef.current) return;
    const chars = rawText.split('');
    const interval = setInterval(() => {
      if (!elRef.current) return;
      const scrambled = chars.map(c =>
        (c === " " || Math.random() > 0.25)
          ? c
          : "!@#$%^&*()_+-=[]{}|;:,.<>?/0123456789"[Math.floor(Math.random() * 30)]
      ).join('');
      elRef.current.innerText = scrambled;
    }, speed);
    return () => {
      clearInterval(interval);
      if (elRef.current) elRef.current.innerText = rawText;
    };
  }, [isActive, rawText, speed]);

  return <span ref={elRef} className="glitch-wrapper">{rawText}</span>;
});

const CentralStatus = memo(({ mode, visible }) => {
  return (
    <div className={`central-status ${visible ? 'visible' : ''}`}>
      <div className="status-container">
        <div className="status-content">
          <div className="status-header">
            <span className="status-id">PGZ_INF_001</span>
            <span className="status-auth">System_Authenticated</span>
          </div>

          <div className="status-title">
            <GlitchText text={String(mode).toUpperCase()} isActive={visible} />
          </div>

          <div className="status-progress">
            <div className={`progress-bar ${visible ? 'animate' : ''}`} />
          </div>

          <div className="status-footer">
            <div className="status-brand">
              <Zap size={14} fill="currentColor" />
              <span>PROMPTPLAYGROUNDZ // GLOBAL</span>
            </div>
            <div className="status-lock">
              <Activity size={12} className="pulse" />
              <span>STATUS: LOCKED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

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
          <div
            className="wall-track"
            style={{
              animationDuration: `${row.duration}s`,
              animationDelay: `${row.delay}s`
            }}
          >
            {row.items.map((item, idx) => (
              <div
                key={`${row.id}-${idx}`}
                className="wall-card"
                onClick={() => onCardClick(item.displayTitle, item.text)}
              >
                {item.displayTitle}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

const LibraryCard = memo(({ item, index, onSelect }) => {
  const images = [
    '1550751827-4bd374c3f58b',
    '1451187580459-43490279c0fa',
    '1518770660439-4636190af475',
    '1639762681031-409c61237eb9'
  ];

  const staggerDelay = useMemo(() => `${(index * 0.73) % 4.5}s`, [index]);

  return (
    <div onClick={() => onSelect(item)} className="library-card album-card">
      <div
        className="card-bg-image"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-${images[index % images.length]}?auto=format&fit=crop&q=80&w=600)`
        }}
      />

      <div className="scanner-line" style={{ animationDelay: staggerDelay }} />

      <div className="card-title album-title">
        <h4>{cleanPayload(item.displayTitle || item.title)}</h4>
        <span className="album-meta">{item.tier?.toUpperCase() || 'OPTIMIZED'}</span>
      </div>
    </div>
  );
});

const PricingModal = ({ onClose, onSelectTier, currentInput }) => {
  const entitlements = getEntitlements();

  return (
    <div className="pricing-modal">
      <div className="pricing-container">
        <button onClick={onClose} className="modal-close"><X size={32} /></button>

        <div className="pricing-header">
          <h2>Choose Your Optimization Level</h2>
          <p>Unlock intelligence. Transform your prompt.</p>
        </div>

        <div className="pricing-grid">
          {Object.values(PRICING_TIERS).map(tier => (
            <div key={tier.id} className={`pricing-card ${tier.featured ? 'featured' : ''}`}>
              {tier.featured && <div className="featured-badge">PRIMARY</div>}
              <div className="tier-name">{tier.name}</div>
              <div className="tier-price">
                ${tier.price}
                {tier.period && <span className="tier-period">/{tier.period}</span>}
              </div>
              <div className="tier-tagline">{tier.tagline}</div>
              <div className="tier-description">{tier.description}</div>

              {entitlements[tier.id] > 0 && tier.id !== 'unlimited' && (
                <div className="tier-credits">{entitlements[tier.id]} credit(s) available</div>
              )}
              {entitlements.unlimited && tier.id === 'unlimited' && (
                <div className="tier-active">ACTIVE</div>
              )}

              <button
                onClick={() => onSelectTier(tier.id)}
                className="tier-action"
                disabled={tier.id === 'system' && currentInput.length > 10000}
              >
                {entitlements[tier.id] > 0 || (tier.id === 'unlimited' && entitlements.unlimited)
                  ? 'Use Credit'
                  : 'Purchase'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const OptimizationResult = ({ result, onClose, onCopy, onUnlock }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);

  const snippet = result.optimizedPrompt.slice(0, 150) + '...';

  return (
    <div className="optimization-result">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="result-bg-video"
        src="https://firebasestorage.googleapis.com/v0/b/prompt-playgroundz.firebasestorage.app/o/Arcade_Prompt_Playgroundz.mp4?alt=media&token=17814a71-e8d6-49dd-9be8-450e6b65f434"
      />

      <div className="result-overlay" />

      <div className="result-container">
        <button onClick={onClose} className="result-close"><X size={32} /></button>

        <div className="result-header">
          <Sparkles size={48} className="result-icon" />
          <h1>Optimization Complete</h1>
          <p>Your prompt has been transformed</p>
        </div>

        <div className="result-content">
          {isUnlocked ? (
            <div className="result-full">
              <pre>{result.optimizedPrompt}</pre>
              <button onClick={() => onCopy(result.optimizedPrompt)} className="result-copy">
                <Zap size={20} fill="currentColor" />
                Copy Optimized Prompt
              </button>
            </div>
          ) : (
            <div className="result-gated">
              <div className="result-snippet">{snippet}</div>
              <div className="result-blur">
                <div className="blur-content">
                  {result.optimizedPrompt.slice(150)}
                </div>
              </div>
              <button
                onClick={() => {
                  setIsUnlocked(true);
                  onUnlock();
                }}
                className="result-unlock"
              >
                <Unlock size={24} />
                Unlock Full Result
              </button>
            </div>
          )}
        </div>

        <div className="result-meta">
          <span>Tier: {result.tier.toUpperCase()}</span>
          <span>•</span>
          <span>Saved to Library</span>
        </div>
      </div>
    </div>
  );
};

const MagazineDetail = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="magazine-detail">
      <div className="magazine-container">
        <div className="magazine-left">
          <div className="magazine-cover">
            <div className="scanner-line" />
            <h2>{item.displayTitle || item.title}</h2>
          </div>

          <div className="magazine-meta">
            <div className="meta-item">
              <label>Type</label>
              <span>{item.tier?.toUpperCase() || 'OPTIMIZED'}</span>
            </div>
            <div className="meta-item">
              <label>Created</label>
              <span>{new Date(item.timestamp || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="magazine-right">
          <button onClick={onClose} className="magazine-close"><X size={32} /></button>

          <div className="magazine-content">
            <h3>Optimized Prompt</h3>
            <pre className="magazine-code">{item.text || item.optimizedPrompt}</pre>

            {item.originalPrompt && (
              <>
                <h3>Original Input</h3>
                <p className="magazine-original">{item.originalPrompt}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('wall');
  const [isTransferring, setIsTransferring] = useState(false);
  const [statusMode, setStatusMode] = useState('optimizing');
  const [isStatusVisible, setIsStatusVisible] = useState(false);
  const [library, setLibrary] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [injectAnimationActive, setInjectAnimationActive] = useState(false);

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ppz-theme') || 'dark';
    }
    return 'dark';
  });

  // PROMPT OPTIMIZATION STATE
  const [promptInput, setPromptInput] = useState('');
  const [showPricing, setShowPricing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ppz-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    let unsubscribe = null;

    const init = async () => {
      const { auth, db, error } = await initializeFirebase();

      if (error) {
        console.error('Firebase initialization failed:', error);
        return;
      }

      setFirebaseReady(true);
      setupOfflineSync();

      if (auth) {
        unsubscribe = onAuthStateChanged(auth, setUser);
      }
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || !firebaseReady) return;

    const db = getFirebaseDb();
    if (!db) return;

    const q = query(collection(db, 'artifacts', 'prompt-playgroundz-v1', 'users', user.uid, 'library'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLibrary(items);
    }, (error) => {
      console.error('Library snapshot error:', error);
    });

    return unsubscribe;
  }, [user, firebaseReady]);

  // Load library from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('ppz_library');
    if (stored) {
      const items = JSON.parse(stored);
      setLibrary(prev => {
        const merged = [...items, ...prev];
        const unique = merged.filter((item, index, self) =>
          index === self.findIndex((t) => t.id === item.id)
        );
        return unique;
      });
    }
  }, []);

  // Persist library to localStorage
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
    // DEV ONLY: Simulate purchase by granting entitlement
    // In production, this would integrate with Stripe/payment processor
    console.log('[DEV] Simulating purchase for tier:', tierId);
    grantEntitlement(tierId);
    handleTierSelect(tierId);
  };

  const handleTierSelect = (tierId) => {
    const hasCredit = consumeCredit(tierId);

    if (!hasCredit) {
      // No credit available - trigger purchase flow
      handlePurchase(tierId);
      return;
    }

    // Optimize the prompt
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

    setOptimizationResult(result);
    setShowPricing(false);
  };

  const handleCopyOptimized = async (text) => {
    const success = await copyToClipboard(text);

    if (success) {
      setStatusMode('COPIED');
      setIsStatusVisible(true);
      setTimeout(() => setIsStatusVisible(false), 600);
    }
  };

  const handleUnlockResult = () => {
    // Save to library
    if (optimizationResult) {
      const newItem = { ...optimizationResult };
      setLibrary(prev => [newItem, ...prev]);

      // Also save to Firestore if user is authenticated
      if (user && firebaseReady) {
        const db = getFirebaseDb();
        if (db) {
          const collectionPath = `artifacts/prompt-playgroundz-v1/users/${user.uid}/library`;
          try {
            if (isOnline()) {
              addDoc(collection(db, collectionPath), {
                ...newItem,
                timestamp: serverTimestamp()
              });
            }
          } catch (error) {
            console.error('Failed to save to Firestore:', error);
          }
        }
      }
    }
  };

  const handleCardClick = (title, text) => {
    setIsTransferring(true);
    setInjectAnimationActive(true);

    copyToClipboard(text);

    setTimeout(() => {
      setStatusMode('injecting');
      setIsStatusVisible(true);
    }, 50);

    setTimeout(() => {
      setStatusMode('COPIED');
    }, 250);

    setTimeout(() => {
      setIsStatusVisible(false);
      setInjectAnimationActive(false);
      setIsTransferring(false);
    }, 600);
  };

  const activeItem = useMemo(
    () => library.find(p => p.id === selectedItemId) || null,
    [library, selectedItemId]
  );

  return (
    <div className="app">
      {/* Navigation - Light/Dark toggle moved to top-right */}
      <nav className="app-nav">
        <div className="nav-brand">
          <div className="nav-entity">ENTITY // THECORPORATIONCORP</div>
        </div>
        <div className="nav-info">
          SYS_VOL.02 // {String(user?.uid || "").slice(0, 6)}
        </div>
        <button
          onClick={toggleTheme}
          className="theme-toggle-flat"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
        </button>
      </nav>

      {/* Main content */}
      <main className="app-main">
        {view === 'wall' && (
          <div className={`wall-view ${injectAnimationActive ? 'inject-active' : ''}`}>
            <PromptWall onCardClick={handleCardClick} />
            <div className="wall-overlay">
              <h1 className={`app-title ${injectAnimationActive ? 'scrambling' : ''}`}>
                {injectAnimationActive ? (
                  <GlitchText text="PROMPT PLAYGROUNDZ" isActive={true} speed={30} />
                ) : (
                  <>
                    PROMPT
                    <br />
                    PLAYGROUNDZ
                  </>
                )}
              </h1>

              {/* PROMPT OPTIMIZATION INPUT - PRIMARY FUNCTION */}
              <div className="optimize-input-container">
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleOptimize();
                    }
                  }}
                  placeholder="Paste your prompt to optimize..."
                  className="optimize-input"
                  rows={4}
                />
                <button
                  onClick={handleOptimize}
                  className="optimize-button"
                  disabled={!promptInput.trim()}
                >
                  <Sparkles size={20} />
                  Optimize Prompt
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'drops' && (
          <div className="drops-view magazine-drops">
            <div className="drops-editorial-header">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="drops-bg-video"
                src="https://firebasestorage.googleapis.com/v0/b/prompt-playgroundz.firebasestorage.app/o/Arcade_Prompt_Playgroundz.mp4?alt=media&token=17814a71-e8d6-49dd-9be8-450e6b65f434"
              />
              <div className="drops-header-content">
                <h1>Drops</h1>
                <p>Magazine · Media · Commerce</p>
              </div>
            </div>

            <div className="drops-magazine-content">
              <div className="editorial-section">
                <div className="editorial-label">FEATURED EDITORIAL</div>
                <h2>The State of AI Prompting in 2025</h2>
                <p>A personal viewpoint on intelligence, precision, and the craft of prompt engineering.</p>
                <button className="editorial-action">
                  <Play size={16} />
                  Read Article
                </button>
              </div>

              <div className="curated-prompts-section">
                <div className="section-header">
                  <h3>My Personal Collection</h3>
                  <span>Curated system-level prompts</span>
                </div>

                <div className="curated-grid">
                  <div className="curated-card">
                    <div className="curated-title">Complete PWA Foundation System</div>
                    <div className="curated-description">Multi-page architectural framework for building production-ready Progressive Web Apps</div>
                    <div className="curated-price">$24.99</div>
                    <button className="curated-action">Purchase</button>
                  </div>

                  <div className="curated-card">
                    <div className="curated-title">Custom GPT Behavior Engine</div>
                    <div className="curated-description">Comprehensive system for defining GPT personalities, constraints, and execution logic</div>
                    <div className="curated-price">$19.99</div>
                    <button className="curated-action">Purchase</button>
                  </div>

                  <div className="curated-card featured">
                    <div className="featured-badge">WEEKLY DROP</div>
                    <div className="curated-title">The Intelligence Framework</div>
                    <div className="curated-description">My personal meta-system for prompt optimization across all domains</div>
                    <div className="curated-price">$49.99</div>
                    <button className="curated-action">Get Now</button>
                  </div>
                </div>
              </div>

              <div className="newsletter-section">
                <div className="newsletter-content">
                  <h3>Subscribe to Weekly Insights</h3>
                  <p>Prompt engineering, AI developments, and exclusive drops delivered every Monday.</p>
                  <div className="newsletter-form">
                    <input type="email" placeholder="Enter your email" />
                    <button>Subscribe</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'library' && (
          <div className="library-view">
            <div className="library-header">
              <h3>Archive_Library</h3>
            </div>

            <div className="library-content">
              {library.length === 0 ? (
                <div className="library-empty">
                  <LibraryIcon size={64} strokeWidth={1} />
                  <p>Optimize a prompt to start your library</p>
                </div>
              ) : (
                <div className="library-grid album-grid">
                  {library.map((item, idx) => (
                    <LibraryCard
                      key={item.id}
                      item={item}
                      index={idx}
                      onSelect={(p) => setSelectedItemId(p.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      <div className="app-footer">
        <button onClick={() => setView('wall')} className={view === 'wall' ? 'active' : ''}>
          <Seesaw size={24} />
          <span>PLAYGROUNDS</span>
        </button>
        <button onClick={() => setView('drops')} className={view === 'drops' ? 'active' : ''}>
          <ShoppingBag size={24} />
          <span>DROPS</span>
        </button>
        <button onClick={() => setView('library')} className={view === 'library' ? 'active' : ''}>
          <LibraryIcon size={24} />
          <span>LIBRARY</span>
        </button>
      </div>

      {/* Modals */}
      {showPricing && (
        <PricingModal
          onClose={() => setShowPricing(false)}
          onSelectTier={handleTierSelect}
          currentInput={promptInput}
        />
      )}

      {optimizationResult && (
        <OptimizationResult
          result={optimizationResult}
          onClose={() => {
            setOptimizationResult(null);
            setPromptInput('');
          }}
          onCopy={handleCopyOptimized}
          onUnlock={handleUnlockResult}
        />
      )}

      {activeItem && (
        <MagazineDetail
          item={activeItem}
          onClose={() => setSelectedItemId(null)}
        />
      )}

      <CentralStatus mode={statusMode} visible={isStatusVisible} />
    </div>
  );
}
