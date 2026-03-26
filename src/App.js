
import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Menu, 
  X, 
  Star, 
  MapPin, 
  Coins, 
  LogOut,
  Flame 
} from 'lucide-react';
import './App.css';
import * as mockData from './data/mockData';
import Loader from './components/ui/Loader';
import PartyMeter from './components/PartyMeter';
import HamburgerMenu from './components/HamburgerMenu';
import { detectConsumptionAnomalies, useAIInsights } from './utils/aiInsights';
import Strike1WarningModal from './components/Strike1WarningModal';
import BannedScreenModal from './components/BannedScreenModal';

// Lazy load heavy components
const Dashboard = lazy(() => import('./components/Dashboard'));
const Settings = lazy(() => import('./components/Settings'));
const Notifications = lazy(() => import('./components/Notifications'));
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const BluntWrapped = lazy(() => import('./components/BluntWrapped')); // Changed from BluntWrapped
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const KingsAura = lazy(() => import('./components/KingsAura'));
const UpdateModal = lazy(() => import('./components/UpdateModal'));
const PWAInstallGuideModal = lazy(() => import('./components/PWAInstallGuideModal'));

function App() {
  const [consumptionData, setConsumptionData] = useState([]);
  const [selectedDrinks, setSelectedDrinks] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [bestStreak, setBestStreak] = useState(0);

  const [goals, setGoals] = useState({});
  const [settings, setSettings] = useState({});

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showStrike1Warning, setShowStrike1Warning] = useState(false);
  const [bannedState, setBannedState] = useState(null);
  const [showHamburger, setShowHamburger] = useState(false);
  const [showPWAInstallGuide, setShowPWAInstallGuide] = useState(false);
  const [activeIAModal, setActiveIAModal] = useState(null); // 'anomaly' | 'streak' | 'partyMeter' | null
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [showWrapped, setShowWrapped] = useState(false);
  // Wrapped Activation Logic
  const checkIsWrappedActive = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    // Active if it's the last 2 days of a month, or the first 2 days of a month
    return now.getDate() >= lastDay.getDate() - 2 || now.getDate() <= 2;
  };
  const isWrappedActive = checkIsWrappedActive();
  const [userProfile, setUserProfile] = useState(() => {
    const sex = localStorage.getItem('partyMeterSex');
    const weight = localStorage.getItem('partyMeterWeight');
    return { sex, weight };
  });

  useEffect(() => {
    const handleBanned = (e) => {
      if (e.detail && e.detail.message) {
          setBannedState({
            type: 'perma',
            message: e.detail.message,
            ban_until: e.detail.ban_until
          });
      } else if (typeof e.detail === 'string') {
          setBannedState({
            type: 'perma',
            message: e.detail,
            ban_until: null
          });
      }
    };
    window.addEventListener('userBanned', handleBanned);
    return () => window.removeEventListener('userBanned', handleBanned);
  }, []);

  const fetchUserData = useCallback((username) => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    const t = Date.now();
    return Promise.all([
      fetch(`${backendUrl}/api/consumption?t=${t}`, { credentials: 'include' }).then((res) => (res.ok ? res.json() : [])),
      fetch(`${backendUrl}/api/goals?t=${t}`, { credentials: 'include' }).then((res) => (res.ok ? res.json() : {})),
      fetch(`${backendUrl}/api/settings?t=${t}`, { credentials: 'include' }).then((res) => (res.ok ? res.json() : {})),
      fetch(`${backendUrl}/api/leaderboard?t=${t}`, { credentials: 'include' }).then((res) => (res.ok ? res.json() : [])),
    ]).then(([consumption, goals, settings, leaderboard]) => {
      setConsumptionData(consumption);
      setGoals(goals);
      setSettings(settings);
      setLeaderboardData(leaderboard);

      if (leaderboard && leaderboard.length > 0 && username) {
        const uIndex = leaderboard.findIndex((u) => u.username === username);
        setUserRank(uIndex !== -1 ? uIndex + 1 : null);
      } else {
        setUserRank(null);
      }

      setInitialLoading(false);
      setLoading(false);

      // Check for App Updates (v2.1)
      const updateKey = 'bluntTracker_v2_1_seen';
      if (!localStorage.getItem(updateKey)) {
        // [User Request: Disabled temporarily for now. Can be re-enabled for v2.2]
        // setTimeout(() => {
        //   setShowUpdateModal(true);
        //   localStorage.setItem(updateKey, 'true');
        // }, 1500);
      }

      // Check for PWA Tutorial (Mobile Only, Non-Standalone, Once per User)
      const pwaGuideKey = 'bluntTracker_pwaGuide_seen';
      if (!localStorage.getItem(pwaGuideKey)) {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
        
        if (isMobile && !isStandalone) {
          // Dynamically preload the WebP assets so they are cached by the time the modal opens
          ['tut-1.webp', 'tut-2.webp', 'tut-3.webp', 'tut-4.webp'].forEach(imgName => {
            const img = new Image();
            img.src = `/tutorial-images/${imgName}`;
          });

          setTimeout(() => {
            setShowPWAInstallGuide(true);
            localStorage.setItem(pwaGuideKey, 'true');
          }, 4500); // Show slightly after update modal resolves or on boot
        }
      }

      // Notify user about Blunt Wrapped
      if (isWrappedActive) {
        const now = new Date();
        const notifiedKey = `wrappedNotified_${now.getFullYear()}_${now.getMonth()}`;
        if (!localStorage.getItem(notifiedKey)) {
          localStorage.setItem(notifiedKey, 'true');
          setTimeout(() => {
            setNotifications(prev => [...prev, {
              id: Date.now(),
              message: "¡Tu Blunt Wrapped Mensual está listo! 🎉" // Changed text
            }]);
          }, 2000);
        }
      }
    });
  }, [isWrappedActive]);

  useEffect(() => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    
    // Check if the user has an active HttpOnly session
    fetch(`${backendUrl}/api/auth/me`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((userData) => {
        setUser({ username: userData.username });
        fetchUserData(userData.username);
      })
      .catch(() => {
        // No active session cookie
        setUser(null);
        setInitialLoading(false);
        setLoading(false);
      });
  }, [fetchUserData]);

  const handleLogin = (userObj) => {
    setUser(userObj);
    localStorage.setItem('bluntTrackerUser', userObj.username);
    setLoading(true);
    fetchUserData(userObj.username);
  };

  const handleLogout = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    fetch(`${backendUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
    }).then(() => {
        setUser(null);
        setConsumptionData([]);
        localStorage.removeItem('bluntTrackerUser');
        localStorage.removeItem('bluntRotationData');
    }).catch(err => console.error(err));
  };

  const refreshUserRank = useCallback(() => {
    if (!user) return;
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    fetch(`${backendUrl}/api/leaderboard?t=${Date.now()}`, {
      credentials: 'include',
      cache: 'no-store'
    })
      .then(res => res.ok ? res.json() : [])
      .then(leaderboard => {
        setLeaderboardData(leaderboard);
        const currentUsername = localStorage.getItem('bluntTrackerUser');
        if (leaderboard && leaderboard.length > 0 && currentUsername) {
          const uIndex = leaderboard.findIndex((u) => u.username === currentUsername);
          setUserRank(uIndex !== -1 ? uIndex + 1 : null);
        } else {
          setUserRank(null);
        }
      })
      .catch(err => console.error("Error refreshing rank:", err));
  }, [user]);

  // Guardar solo el día modificado
  const saveConsumptionDay = useCallback(
    (day) => {
      if (!user) return;
      const dayWithUser = { ...day, username: user.username };
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      fetch(`${backendUrl}/api/consumption`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(dayWithUser),
      })
        .then((res) => {
          if (res.status === 429) {
            // localStorage.setItem('mt_uuid_ban', 'true'); [DISABLED]
            handleLogout();
            res.json().then(errorData => {
                setBannedState({
                  type: 'kick',
                  message: errorData.detail?.message || 'Has sido bloqueado temporalmente por spam.',
                  ban_until: errorData.detail?.ban_until || null
                });
            }).catch(() => {
                setBannedState({ type: 'kick', message: 'Has sido bloqueado temporalmente por spam.', ban_until: null });
            });
            throw new Error('too_many_requests_ban');
          }
          if (res.status === 403) {
             handleLogout();
             res.json().then(errorData => {
                 setBannedState({
                   type: 'perma',
                   message: errorData.detail?.message || (typeof errorData.detail === 'string' ? errorData.detail : 'Tu cuenta está temporal o permanentemente suspendida.'),
                   ban_until: errorData.detail?.ban_until || null
                 });
             }).catch(() => {
                 setBannedState({ type: 'perma', message: 'Tu cuenta está temporal o permanentemente suspendida.', ban_until: null });
             });
            throw new Error('banned');
          }
          if (!res.ok) {
            console.error(
              '[FRONTEND] Error al guardar consumo:',
              res.status,
              res.statusText
            );
          }
          return res.json().catch(() => null);
        })
        .then((data) => {
          if (data) {
             refreshUserRank();
          }
        })
        .catch((err) => {
          console.error('[FRONTEND] Error de red al guardar consumo:', err);
        });
    },
    [user, refreshUserRank]
  );

  const handleDrinkSelect = useCallback(
    (drink) => {
       if (user) {
           // Small delay to ensure DB consistency across all users in rotation
           return new Promise(resolve => {
               setTimeout(() => {
                   fetchUserData(user.username).then(resolve);
               }, 500);
           });
       }
       return Promise.resolve();
    },
    [user, fetchUserData]
  );

  const handleDrinkDelete = useCallback(
    (bluntIndex, targetDate = null) => {
      const dateStr = targetDate || new Date().toISOString().split('T')[0];
      const targetData = consumptionData.find((d) => d.date === dateStr);

      if (!targetData || !targetData.blunts[bluntIndex]) return;

      const deletedBlunt = targetData.blunts[bluntIndex];
      const deletedBluntData = mockData.bluntDrinks.find(
        (d) => d.id === deletedBlunt.id
      );

      // Remove the blunt and update totals
      const updatedBlunts = targetData.blunts.filter(
        (_, index) => index !== bluntIndex
      );

      let updatedData;
      if (updatedBlunts.length === 0) {
        updatedData = consumptionData.filter((d) => d.date !== dateStr);
      } else {
        updatedData = consumptionData.map((d) =>
          d.date === dateStr
            ? {
                ...d,
                blunts: updatedBlunts,
                totalBlunts: Math.max(0, targetData.totalBlunts - 1),
              }
            : d
        );
      }

      setConsumptionData(updatedData);
      
      if (updatedBlunts.length === 0) {
        // Delete from backend
        const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
        fetch(`${backendUrl}/api/consumption/${dateStr}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        .then(() => refreshUserRank())
        .catch(err => console.error("Error deleting empty day:", err));
      } else {
        saveConsumptionDay(updatedData.find((d) => d.date === dateStr));
      }

      // Show deletion notification
      addNotification({
        type: 'info',
        title: 'Blunt Removed',
        message: `${deletedBluntData?.name || 'Blunt'} has been removed from today's rotation.`,
        autoHide: true,
        duration: 3000,
      });
    },
    [consumptionData, saveConsumptionDay, refreshUserRank]
  );

  const addNotification = (notification) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { ...notification, id }]);
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleGoalsUpdate = (newGoals) => {
    setGoals(newGoals);
    // No localStorage
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    fetch(`${backendUrl}/api/goals`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(newGoals),
    });
  };

  const handleSettingsUpdate = (newSettings) => {
    setSettings(newSettings);
    // No localStorage
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    fetch(`${backendUrl}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(newSettings),
    });
  };

  // Guardar sexo y peso para PartyMeter
  const handleSavePartyProfile = ({ sex, weight }) => {
    setUserProfile({ sex, weight });
    localStorage.setItem('partyMeterSex', sex);
    localStorage.setItem('partyMeterWeight', weight);
  };

  // Guardar sexo y peso para PartyMeter desde settings
  useEffect(() => {
    if (settings.partyMeterSex && settings.partyMeterWeight) {
      setUserProfile({
        sex: settings.partyMeterSex,
        weight: settings.partyMeterWeight,
      });
      localStorage.setItem('partyMeterSex', settings.partyMeterSex);
      localStorage.setItem('partyMeterWeight', settings.partyMeterWeight);
    }
  }, [settings.partyMeterSex, settings.partyMeterWeight]);

  // Sincroniza el perfil PartyMeter con settings al abrir el modal
  useEffect(() => {
    if (activeIAModal === 'partyMeter') {
      if (settings.partyMeterSex && settings.partyMeterWeight) {
        setUserProfile({
          sex: settings.partyMeterSex,
          weight: settings.partyMeterWeight,
        });
        localStorage.setItem('partyMeterSex', settings.partyMeterSex);
        localStorage.setItem('partyMeterWeight', settings.partyMeterWeight);
      }
    }
  }, [activeIAModal, settings.partyMeterSex, settings.partyMeterWeight]);

  if (initialLoading) return <Loader />;
  if (loading) return <Loader />;
  if (!user) {
    return (
      <div className="relative min-h-screen bg-black overflow-hidden">
        <Suspense fallback={<Loader />}>
          {showRegister ? (
            <Register
              onRegister={handleLogin}
              onSwitchToLogin={() => setShowRegister(false)}
            />
          ) : (
            <Login
              onLogin={handleLogin}
              onSwitchToRegister={() => setShowRegister(true)}
            />
          )}
          {bannedState && (
            <BannedScreenModal
              type={bannedState.type}
              message={bannedState.message}
              banUntil={bannedState.ban_until}
              onClose={() => setBannedState(null)}
            />
          )}
        </Suspense>
      </div>
    );
  }

  return (
    <div className='min-h-screen text-white relative overflow-hidden'>
      {/* Animated Background Layer - Professional 100lvh constraint for mobile */}
      <div className='fixed top-0 left-0 w-full h-[100lvh] z-0 pointer-events-none'>
        {/* Base Fixed Image Hardware Accelerated */}
        <div className="fixed-background" />
        
        {/* Dark Gradient Overlay for depth */}
        <div className='absolute inset-0 bg-gradient-to-br from-black/60 via-transparent to-black/60' />
        
        {/* Leaf Background Overlay (hoja) */}
        <div 
          className='absolute inset-0 opacity-[0.25]'
          style={{
            backgroundImage: 'url("/blunt-images/Hoja_Fondo.png")',
            backgroundSize: 'auto 100%', /* Fija la hoja a la altura de la pantalla en PC y móvil */
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            mixBlendMode: 'screen'
          }}
        />
        
        {/* Moving Green Color Effect */}
        <div className='absolute inset-0'>
          <motion.div
            className='absolute top-0 left-0 w-full h-full opacity-50'
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, #008f26 0%, transparent 60%)',
                'radial-gradient(circle at 80% 20%, #008f26 0%, transparent 60%)',
                'radial-gradient(circle at 40% 80%, #008f26 0%, transparent 60%)',
                'radial-gradient(circle at 20% 50%, #008f26 0%, transparent 60%)',
              ],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </div>

      {userRank === 1 && (
        <Suspense fallback={null}>
          <KingsAura />
        </Suspense>
      )}

      {/* Notifications */}
      <Suspense fallback={<Loader />}>
        <Notifications
          notifications={notifications}
          onDismiss={dismissNotification}
        />
      </Suspense>
      
      <Strike1WarningModal
         isOpen={showStrike1Warning}
         onClose={() => setShowStrike1Warning(false)}
      />
      {/* SVG Filter for Organic Smoke Distortion - Global */}
      <svg className="absolute w-0 h-0 invisible" aria-hidden="true">
        <filter id="smoke-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="2">
            <animate attributeName="baseFrequency" dur="30s" values="0.012;0.02;0.012" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="15" />
        </filter>
      </svg>

      {/* Header */}
      <motion.header
        className='relative z-10 px-8 pb-6 pt-2 border-b border-green-500/20 backdrop-blur-md'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className='max-w-7xl mx-auto flex justify-between items-end'>
          <motion.div className='flex flex-col items-start pt-2'>
            <div className="relative z-0 h-16 md:h-20 w-[calc(100vw-140px)] md:w-[60vw] max-w-[450px] overflow-visible">
              <svg 
                className='w-full h-full overflow-visible' 
                viewBox="0 0 420 100" 
                preserveAspectRatio="xMinYMid meet"
                style={{ filter: 'drop-shadow(0 0 12px rgba(0,0,0,0.9)) drop-shadow(0 0 10px rgba(255,255,255,0.35))' }}
              >
                <defs>
                  <linearGradient id="blunt-metal-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d1d5db" />
                    <stop offset="50%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#9ca3af" />
                  </linearGradient>
                </defs>
                {(() => {
                  const offsets = [0, 48, 75, 108, 142, 170, 205, 248, 280, 315, 350, 385, 415];
                  return "Blunt Tracker".split('').map((char, index) => (
                    <motion.text
                      key={index}
                      x={offsets[index]}
                      y="65"
                      className="smoke-char-svg"
                      style={{ 
                        '--delay': `${index * 0.15}s`,
                        fontFamily: "'Ruthless', cursive",
                        fill: "url(#blunt-metal-grad)",
                        fontSize: "48px",
                           fontWeight: "normal"
                      }}
                    >
                      {char}
                    </motion.text>
                  ));
                })()}
              </svg>
            </div>
            
            <motion.p
              className='blunt-subtitle relative z-10 text-sm md:text-base whitespace-nowrap mt-6 opacity-70'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              The Ultimate Rotation & Session Tracker
            </motion.p>
            
            {userRank !== null && userRank <= 3 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={`mt-3 pl-2 pr-5 h-12 md:h-14 flex gap-3 md:gap-4 items-center justify-center rounded-lg border-2 font-black text-xl md:text-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)] 
                  ${userRank === 1 ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.5)]' : 
                    userRank === 2 ? 'bg-gray-300/20 border-gray-300 text-gray-200 shadow-[0_0_20px_rgba(209,213,219,0.3)]' : 'bg-amber-700/30 border-amber-600 text-amber-500 shadow-[0_0_20px_rgba(217,119,6,0.3)]'}
                `}
              >
                <img 
                  src={`/blunt-images/${userRank === 1 ? 'corona_dorada' : userRank === 2 ? 'corona_plata' : 'corona_cobre'}.png`} 
                  alt="Crown"
                  className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md -ml-1 md:-ml-2"
                />
                <span>{userRank}º</span>
              </motion.div>
            )}
          </motion.div>
          <div className="flex items-center gap-2 sm:gap-4">
              {/* Universal Logout Button */}
              <motion.button
                onClick={handleLogout}
              className="group flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all duration-300 transform-gpu z-20 mr-12"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="w-4 h-4 text-red-500 group-hover:rotate-12 transition-transform" />
              <span className="text-[10px] sm:text-xs font-black uppercase text-red-500 tracking-widest hidden xs:block">Log Out</span>
            </motion.button>

            {/* Mobile Menu Icon (No circle) */}
            <motion.button
              onClick={() => setShowHamburger(true)}
              className="p-2 text-green-400 hover:text-green-300 md:hidden z-20"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Menu className='w-7 h-7' />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className='relative z-10 max-w-7xl mx-auto p-4 md:p-6'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Suspense fallback={<Loader />}>
            <Dashboard
              consumptionData={consumptionData}
              goals={goals}
              bestStreak={bestStreak}
              setBestStreak={setBestStreak}
              onDrinkDelete={handleDrinkDelete}
              onDrinkSelect={handleDrinkSelect}
              selectedDrinks={selectedDrinks}
              currentUser={user.username}
              leaderboardData={leaderboardData}
              onRefreshLeaderboard={refreshUserRank}
            />
          </Suspense>
        </motion.div>
      </main>

      {/* Settings Modal */}
      <Suspense fallback={<Loader />}>
        <Settings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          goals={goals}
          onGoalsUpdate={handleGoalsUpdate}
          settings={settings}
          onSettingsUpdate={handleSettingsUpdate}
          onShowPWAGuide={() => setShowPWAInstallGuide(true)}
        />
        <UpdateModal 
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
        />
        <PWAInstallGuideModal
          isOpen={showPWAInstallGuide}
          onClose={() => setShowPWAInstallGuide(false)}
        />
      </Suspense>

      {/* IA Modals & Leaderboard */}
      {activeIAModal === 'partyMeter' && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80'>
          <div className='w-full max-w-lg mx-auto relative'>
            <button
              className='absolute top-2 right-2 z-20 text-white bg-pink-700 rounded-full p-2 shadow-lg'
              onClick={() => setActiveIAModal(null)}
            >
              <X className='w-6 h-6' />
            </button>
            <PartyMeter
              userSex={userProfile.sex}
              userWeight={userProfile.weight}
              onSaveProfile={handleSavePartyProfile}
            />
          </div>
        </div>
      )}

      {activeIAModal === 'leaderboard' && (
        <Suspense fallback={<Loader />}>
          <Leaderboard 
            onClose={() => setActiveIAModal(null)} 
          />
        </Suspense>
      )}
      <HamburgerMenu
        open={showHamburger}
        onClose={() => setShowHamburger(false)}
        isWrappedActive={isWrappedActive}
        onSelect={(key) => {
          if (key === 'settings') {
            setShowSettings(true);
          } else if (key === 'logout') {
            handleLogout();
          } else if (key === 'wrapped') { // 'wrapped' key remains the same
            setShowWrapped(true);
          } else {
            setActiveIAModal(key);
          }
          setShowHamburger(false);
        }}
      />
      
      {/* Blunt Wrapped Modal */} {/* Changed comment */}
      {showWrapped && (
        <Suspense fallback={<Loader />}>
          <BluntWrapped // Changed component name
            consumptionData={consumptionData} 
            onClose={() => setShowWrapped(false)} 
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
