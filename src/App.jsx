import React, { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import {
  Zap,
  X,
  ThumbsUp,
  ThumbsDown,
  Info,
  Library as LibraryIcon,
  Activity
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
import { initializeFirebase } from './firebase';
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

// Generate minimal payload
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

// Registry of prompts (150 instruments)
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

// --- COMPONENTS ---

// Seesaw icon component
const Seesaw = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="3" y1="18" x2="21" y2="10" />
    <path d="M12 14l-3 6h6z" />
  </svg>
);

// Glitch text effect
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

// Central status overlay
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

// Prompt wall (infinite scroll illusion)
const PromptWall = memo(({ onCardClick }) => {
  const rows = useMemo(() => {
    // Shuffle once on mount
    const shuffled = shuffleArray(FULL_REGISTRY);

    return Array.from({ length: 20 }).map((_, r) => {
      const startIdx = (r * 20) % shuffled.length;
      const rowItems = [];

      // Get 40 items for seamless loop (20 visible + 20 for continuation)
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

// Library card component
const LibraryCard = memo(({ item, index, onCopy, onSelect, onToggleLike, onRemove }) => {
  const images = [
    '1550751827-4bd374c3f58b',
    '1451187580459-43490279c0fa',
    '1518770660439-4636190af475',
    '1639762681031-409c61237eb9'
  ];

  const staggerDelay = useMemo(() => `${(index * 0.73) % 4.5}s`, [index]);

  return (
    <div onClick={() => onSelect(item)} className="library-card">
      {/* Background image */}
      <div
        className="card-bg-image"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-${images[index % images.length]}?auto=format&fit=crop&q=80&w=600)`
        }}
      />

      {/* Scanner line */}
      <div className="scanner-line" style={{ animationDelay: staggerDelay }} />

      {/* Four corners - LOCKED LAYOUT */}
      {/* Top-Left: COPY */}
      <button
        onClick={(e) => { e.stopPropagation(); onCopy(item.displayTitle, item.text); }}
        className="card-action top-left"
        title="Copy"
      >
        <Zap size={20} fill="currentColor" />
      </button>

      {/* Top-Right: INFO */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(item); }}
        className="card-action top-right"
        title="Details"
      >
        <Info size={20} />
      </button>

      {/* Bottom-Left: DELETE */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(item); }}
        className="card-action bottom-left"
        title="Remove"
      >
        <ThumbsDown size={16} />
      </button>

      {/* Bottom-Right: LIKE (Favorite) */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleLike(item); }}
        className={`card-action bottom-right ${item.liked ? 'active' : ''}`}
        title="Like"
      >
        <ThumbsUp size={16} fill={item.liked ? "currentColor" : "none"} />
      </button>

      {/* Card title */}
      <div className="card-title">
        <h4>{cleanPayload(item.displayTitle)}</h4>
      </div>
    </div>
  );
});

// Prompt detail view
const PromptDetail = ({ item, onClose, onCopy, onToggleLike, onRemove, isClosing }) => {
  const [showVerification, setShowVerification] = useState(false);

  if (!item) return null;

  return (
    <div className={`prompt-detail ${isClosing ? 'closing' : ''}`}>
      <div className="detail-container">
        {/* Left panel - metadata */}
        <div className="detail-left">
          <div className="detail-actions">
            <button onClick={() => onToggleLike(item)} className={`action-btn ${item.liked ? 'active' : ''}`}>
              <ThumbsUp size={16} fill={item.liked ? "currentColor" : "none"} />
            </button>
            <button onClick={() => { onRemove(item); onClose(); }} className="action-btn">
              <ThumbsDown size={16} />
            </button>
          </div>

          <div className="detail-title">
            <span className="label">Intelligence_Report</span>
            <h2>{item.displayTitle}</h2>
          </div>

          <div className="detail-meta">
            <div className="meta-item">
              <label>Phase</label>
              <span>{String(item.usagePhase?.[0] || "General")}</span>
            </div>
            <div className="meta-item">
              <label>Status</label>
              <span>Locked</span>
            </div>
          </div>

          <div className="detail-profile">
            <label>Context_Profile:</label>
            <div className="profile-list">
              <div>• No Context: {String(item.behaviorProfile?.no_context)}</div>
              <div>• Light Context: {String(item.behaviorProfile?.light_context)}</div>
              <div>• Rich Context: {String(item.behaviorProfile?.rich_context)}</div>
            </div>
          </div>

          <div className="detail-footer">Registry_ARC_17.5 // BY THECORPORATIONCORP</div>
        </div>

        {/* Right panel - content */}
        <div className="detail-right">
          <button onClick={onClose} className="close-btn">
            <X size={32} />
          </button>

          <div className="detail-content">
            {!showVerification ? (
              <>
                <div className="copy-button-container">
                  <button onClick={() => onCopy(item.displayTitle, item.text)} className="main-copy-btn">
                    <Zap size={36} fill="currentColor" />
                  </button>
                  <span className="copy-label">Copy_Instrument</span>
                </div>

                <div className="detail-quote">
                  <label>Interview_Insight</label>
                  <h1>"{item.comment}"</h1>
                  <div className="audit-status">
                    <Activity size={12} className="pulse" />
                    <span>Behavioral Audit Completed</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="verification-view">
                <label>Verification_Framework</label>
                <div className="verification-content">
                  <div className="verification-section">
                    <label>Original_Intent</label>
                    <p>"{item.originalPrompt}"</p>
                  </div>
                  <div className="verification-section payload">
                    <label>Optimized_Payload (JSON)</label>
                    <pre>{item.text}</pre>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowVerification(!showVerification)}
              className="toggle-verification"
            >
              {showVerification ? 'View Insight' : 'View Payload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('wall');
  const [isTransferring, setIsTransferring] = useState(false);
  const [statusMode, setStatusMode] = useState('optimizing');
  const [isStatusVisible, setIsStatusVisible] = useState(false);
  const [library, setLibrary] = useState([]);
  const [selectedPromptId, setSelectedPromptId] = useState(null);
  const [isHUDClosing, setIsHUDClosing] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);

  // Initialize Firebase
  useEffect(() => {
    let unsubscribe = null;

    const init = async () => {
      const { auth, db, error } = await initializeFirebase();

      if (error) {
        console.error('Firebase initialization failed:', error);
        return;
      }

      setFirebaseReady(true);

      // Setup offline sync
      setupOfflineSync();

      // Auth listener
      if (auth) {
        unsubscribe = onAuthStateChanged(auth, setUser);
      }
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Listen to library updates
  useEffect(() => {
    if (!user || !firebaseReady) return;

    const { getFirebaseDb } = require('./firebase');
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

  // Handle copy action
  const handleCopy = useCallback(async (title, text, mode = 'optimizing') => {
    if (isTransferring) return;

    const instrument = FULL_REGISTRY.find(p => p.displayTitle === title) || {
      displayTitle: title || "Custom Query",
      internalId: "CUSTOM.v1",
      text,
      originalPrompt: text,
      usagePhase: ["start"],
      behaviorProfile: {
        no_context: "generic",
        light_context: "generic",
        rich_context: "generic"
      },
      comment: "A custom user protocol synthesized from direct input."
    };

    setStatusMode(mode);
    setIsStatusVisible(true);
    setIsTransferring(true);

    const success = await copyToClipboard(text);

    setTimeout(() => {
      setStatusMode('copied');
      setTimeout(() => {
        setIsStatusVisible(false);
        setIsTransferring(false);
      }, 800);
    }, 900);

    // Save to library if successful
    if (success && user && firebaseReady) {
      const { getFirebaseDb } = require('./firebase');
      const db = getFirebaseDb();

      if (db) {
        const collectionPath = `artifacts/prompt-playgroundz-v1/users/${user.uid}/library`;

        try {
          if (isOnline()) {
            await addDoc(collection(db, collectionPath), {
              ...instrument,
              text,
              timestamp: serverTimestamp(),
              liked: false
            });
          } else {
            await queueWrite('add', collectionPath, {
              ...instrument,
              text,
              timestamp: new Date().toISOString(),
              liked: false
            });
          }
        } catch (error) {
          console.error('Failed to save to library:', error);
        }
      }
    }
  }, [user, isTransferring, firebaseReady]);

  // Toggle like
  const toggleLike = async (item) => {
    if (!user || !firebaseReady || !item) return;

    const { getFirebaseDb } = require('./firebase');
    const db = getFirebaseDb();

    if (!db) return;

    const docPath = `artifacts/prompt-playgroundz-v1/users/${user.uid}/library`;

    // Optimistic update
    setLibrary(prev => prev.map(p => p.id === item.id ? { ...p, liked: !p.liked } : p));

    try {
      if (isOnline()) {
        await updateDoc(doc(db, docPath, item.id), { liked: !item.liked });
      } else {
        await queueWrite('update', docPath, { liked: !item.liked }, item.id);
      }
    } catch (err) {
      // Rollback on error
      setLibrary(prev => prev.map(p => p.id === item.id ? { ...p, liked: !item.liked } : p));
      console.error('Failed to toggle like:', err);
    }
  };

  // Remove prompt
  const removePrompt = async (item) => {
    if (!user || !firebaseReady || !item) return;

    const { getFirebaseDb } = require('./firebase');
    const db = getFirebaseDb();

    if (!db) return;

    const docPath = `artifacts/prompt-playgroundz-v1/users/${user.uid}/library`;

    try {
      if (isOnline()) {
        await deleteDoc(doc(db, docPath, item.id));
      } else {
        await queueWrite('delete', docPath, {}, item.id);
      }
    } catch (err) {
      console.error('Failed to remove prompt:', err);
    }
  };

  // Close detail view
  const handleCloseHUD = useCallback(() => {
    setIsHUDClosing(true);
    setTimeout(() => {
      setSelectedPromptId(null);
      setIsHUDClosing(false);
    }, 600);
  }, []);

  const activePrompt = useMemo(
    () => library.find(p => p.id === selectedPromptId) || null,
    [library, selectedPromptId]
  );

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="app-nav">
        <div className="nav-brand">
          <div className="nav-entity">ENTITY // THECORPORATIONCORP</div>
        </div>
        <div className="nav-info">
          SYS_VOL.02 // {String(user?.uid || "").slice(0, 6)}
        </div>
      </nav>

      {/* Main content */}
      <main className="app-main">
        {view === 'wall' && (
          <div className="wall-view">
            <PromptWall onCardClick={(title, text) => handleCopy(title, text)} />
            <div className="wall-overlay">
              <h1 className="app-title">
                PROMPT
                <br />
                PLAYGROUNDZ
              </h1>
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
                  <p>Copy a prompt to start your library</p>
                </div>
              ) : (
                <div className="library-grid">
                  {library.map((item, idx) => (
                    <LibraryCard
                      key={item.id}
                      item={item}
                      index={idx}
                      onCopy={handleCopy}
                      onSelect={(p) => setSelectedPromptId(p.id)}
                      onToggleLike={toggleLike}
                      onRemove={removePrompt}
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
          <span>PLAYGROUND</span>
        </button>
        <button onClick={() => setView('library')} className={view === 'library' ? 'active' : ''}>
          <LibraryIcon size={24} />
          <span>LIBRARY</span>
        </button>
      </div>

      {/* Modals */}
      <PromptDetail
        item={activePrompt}
        isClosing={isHUDClosing}
        onClose={handleCloseHUD}
        onCopy={handleCopy}
        onToggleLike={toggleLike}
        onRemove={removePrompt}
      />

      <CentralStatus mode={statusMode} visible={isStatusVisible} />
    </div>
  );
}
