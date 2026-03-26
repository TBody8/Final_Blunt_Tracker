import React, { useState, useEffect, useRef, lazy, Suspense, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Target,
  Trophy,
  Zap,
  TrendingUp,
  Settings,
  Coffee,
  Award,
  Flame,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Euro,
  ShoppingCart,
  Home,
  Brain,
  Users,
  LayoutDashboard,
  Star,
  MapPin,
  Coins,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { debounce } from '../utils/performance';
import * as mockData from '../data/mockData';
import { calculateAchievements } from '../utils/achievementEngine';
import { TROPHY_LEVELS } from '../data/trophyDefinitions';

// Lazy load non-critical components
const RotationCircle = lazy(() => import('./RotationCircle'));
const AIInsightsPanel = lazy(() => import('./AIInsightsPanel'));

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const getBluntLevel = mockData.getBluntLevel;
const calculateStreak = mockData.calculateStreak;
const getTodayQuote = mockData.getTodayQuote;
const getChartData = mockData.getChartData;
const calculateBestStreak = mockData.calculateBestStreak;

const getPlayerRankInfo = (blunts) => {
  if (blunts >= 1000) return { title: "Snoop's Disciple", textClass: "text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-amber-400 to-yellow-600 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-pulse", iconClass: "text-yellow-300" };
  if (blunts >= 500) return { title: "Cloud King", textClass: "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]", iconClass: "text-yellow-400" };
  if (blunts >= 250) return { title: "Blunt Connoisseur", textClass: "text-pink-400 drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]", iconClass: "text-pink-400" };
  if (blunts >= 100) return { title: "Master Lungs", textClass: "text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]", iconClass: "text-purple-400" };
  if (blunts >= 50) return { title: "Veteran Chief", textClass: "text-blue-400", iconClass: "text-blue-500" };
  if (blunts >= 25) return { title: "Daily Burner", textClass: "text-emerald-400", iconClass: "text-emerald-500" };
  if (blunts >= 10) return { title: "Apprentice Roller", textClass: "text-green-400", iconClass: "text-green-500" };
  return { title: "Rookie Smoker", textClass: "text-gray-400", iconClass: "text-gray-500" };
};

const calculateTotalBlunts = mockData.calculateTotalBlunts;
const calculateTotalCost = mockData.calculateTotalCost;

// Mapeo de nombres completos a nombres resumidos para el tooltip
const bluntNameShortMap = {
  'Classic Joint': 'Joint',
  'Backwoods Blunt': 'Backwoods',
  'Hemp Wrap Blunt': 'Hemp Wrap'
};

// --- Sub-components for App-Mode ---

const BottomNavbar = React.memo(({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'analytics', icon: TrendingUp, label: 'Stats' },
    { id: 'leaderboard', icon: Users, label: 'Ranked' },
    { id: 'trophies', icon: Trophy, label: 'Missions' },
    { id: 'insights', icon: Brain, label: 'AI' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg pointer-events-none transform-gpu will-change-transform">
      <div className="bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center justify-around pointer-events-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex flex-col items-center justify-center w-[72px] h-[56px] group transition-all duration-200 transform-gpu focus:outline-none [-webkit-tap-highlight-color:transparent]"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabGlow"
                    className="absolute inset-0 bg-green-500/15 border border-green-500/20 rounded-2xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <div className={`transition-transform duration-200 transform-gpu ${isActive ? '-translate-y-2 scale-105' : 'translate-y-0 scale-100'}`}>
                  <Icon 
                    className={`w-6 h-6 transition-colors duration-200 ${isActive ? 'text-[#2eef6a]' : 'text-gray-500 group-hover:text-gray-300'}`} 
                  />
                </div>
                <span className={`text-[10px] absolute bottom-1 font-extrabold tracking-wide transition-all duration-200 transform-gpu ${isActive ? 'opacity-100 text-[#2eef6a] translate-y-0' : 'opacity-0 translate-y-2'}`}>
                  {tab.label}
                </span>
              </button>
          );
        })}
      </div>
    </div>
  );
});
BottomNavbar.displayName = 'BottomNavbar';

const RankedStrip = React.memo(({ leaderboardData }) => {
  const top3 = useMemo(() => 
    (leaderboardData || [])
      .sort((a, b) => (b.totalBlunts || 0) - (a.totalBlunts || 0))
      .slice(0, 3)
  , [leaderboardData]);

  const podiumStyles = {
    0: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.08)', border: 'rgba(251, 191, 36, 0.2)', shadow: 'rgba(251, 191, 36, 0.1)' }, // Oro
    1: { color: '#d1d5db', bg: 'rgba(209, 213, 223, 0.08)', border: 'rgba(209, 213, 223, 0.2)', shadow: 'rgba(209, 213, 223, 0.05)' }, // Plata
    2: { color: '#a8573c', bg: 'rgba(168, 87, 60, 0.08)', border: 'rgba(168, 87, 60, 0.2)', shadow: 'rgba(168, 87, 60, 0.05)' }   // Cobre
  };

  if (!top3.length) return null;

  return (
    <div className="bg-gray-950/40 rounded-2xl p-4 mb-6 border border-white/5 shadow-inner overflow-hidden relative group transform-gpu">
      {/* Mini Header */}
      <div className="relative mb-4 flex items-center justify-between border-b border-white/5 pb-2">
        <span className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-black">Top Rankeds</span>
      </div>

      {/* Subtle sweep animation - Optimized with will-change */}
      <motion.div 
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent will-change-transform"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      
      <div className="flex items-center justify-center gap-1.5 sm:gap-3 md:gap-6 py-1">
        {[1, 0, 2].map((posIdx) => {
          const user = top3[posIdx];
          if (!user) return null;
          const isFirst = posIdx === 0;
          const style = podiumStyles[posIdx];
          
          return (
            <motion.div 
              key={user.username}
              initial={false} // Disable initial animation for performance
              className={`px-2 sm:px-4 md:px-5 py-2 md:py-3 rounded-2xl border flex flex-col items-center justify-center transition-all duration-300 transform-gpu flex-1 max-w-[120px] sm:max-w-none
                ${isFirst ? 'shadow-lg z-10 scale-[1.05]' : 'opacity-80 scale-[0.95]'}`}
              style={{ 
                backgroundColor: style.bg, 
                borderColor: style.border,
                boxShadow: isFirst ? `0 0 20px ${style.shadow}` : 'none'
              }}
            >
              <span 
                className={`font-bold tracking-wider truncate w-full text-center drop-shadow-sm ${isFirst ? 'text-base sm:text-lg md:text-xl' : 'text-xs sm:text-sm md:text-base'}`}
                style={{ 
                  fontFamily: "'UnifrakturMaguntia', cursive",
                  color: style.color
                }}
              >
                {user.username}
              </span>
              <div className="flex items-center justify-center gap-1 mt-0.5 sm:mt-1 w-full opacity-90">
                 <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: style.color }} />
                 <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest truncate mr-1" style={{ color: style.color }}>LVL {user.level || 1}</span>
                 {user.optional_achievements && user.optional_achievements.length > 0 && (
                   <span className="flex items-center gap-0.5 opacity-90 border-l border-white/10 pl-1.5 ml-0.5">
                     {user.optional_achievements.slice(0, 2).map(m => (
                        <span key={m.id} className="text-[10px] sm:text-[11px] drop-shadow-md" title={m.name}>{m.icon}</span>
                     ))}
                   </span>
                 )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});
RankedStrip.displayName = 'RankedStrip';

const HomeView = React.memo(({ todayQuote, leaderboardData, memoizedStats, todayData, currentUser, onDrinkSelect, isTransitioning }) => (
  <div className="space-y-8 animate-in fade-in duration-500">
    {/* Quote & Ranked Strip */}
    <div className="space-y-4">
      <div className='relative overflow-hidden bg-gray-950/40 rounded-2xl p-6 border border-white/5 shadow-xl mx-auto w-full max-w-xl flex items-center justify-center transform-gpu'>
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <motion.img 
            src="/blunt-images/smoke.png" 
            alt="smoke background"
            className="w-full h-full object-cover opacity-15 mix-blend-lighten scale-110"
            animate={{ scale: [1.1, 1.12, 1.1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <div 
          className='relative z-10 text-xl md:text-3xl text-center text-white/80 tracking-[0.1em] leading-relaxed italic'
          style={{ fontFamily: "'UnifrakturMaguntia', cursive" }}
        >
          {todayQuote}
        </div>
      </div>
      <RankedStrip leaderboardData={leaderboardData} />
    </div>

    {/* Unified Dashboard Command Center */}
    <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-xl mx-auto">
      <div className="bg-gray-900/60 border border-[#2eef6a]/20 p-3 sm:p-4 rounded-2xl text-center flex flex-col justify-center shadow-inner transition-shadow duration-300 transform-gpu hover:shadow-[0_0_20px_rgba(46,239,106,0.15)]">
        <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#2eef6a] font-black mb-0.5 sm:mb-1">Total Blunts</p>
        <p className="text-xl sm:text-2xl md:text-3xl font-black text-white truncate drop-shadow-md">{memoizedStats.totalBlunts || 0}</p>
      </div>

      <div className="bg-gray-900/60 border border-yellow-500/20 p-3 sm:p-4 rounded-2xl text-center flex flex-col justify-center shadow-inner transition-shadow duration-300 transform-gpu hover:shadow-[0_0_20px_rgba(234,179,8,0.15)]">
        <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-yellow-500 font-black mb-0.5 sm:mb-1">Investment</p>
        <p className="text-xl sm:text-2xl md:text-3xl font-black text-white truncate drop-shadow-md">{(memoizedStats.totalCost || 0).toFixed(2)} €</p>
      </div>

      <div className="bg-gray-950/40 p-3 sm:p-4 rounded-2xl border border-white/5 shadow-lg flex flex-col items-center justify-center text-center transition-colors duration-300 transform-gpu hover:bg-white/5">
        <p className="text-2xl sm:text-3xl font-black text-[#2eef6a] tracking-tighter truncate w-full">
          {todayData.blunts ? todayData.blunts.length : 0}
        </p>
        <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-[0.1em] font-bold mt-0.5 max-w-full truncate px-1">Blunts Today</p>
      </div>

      <div className="bg-gray-950/40 p-3 sm:p-4 rounded-2xl border border-white/5 shadow-lg flex flex-col items-center justify-center text-center transition-colors duration-300 transform-gpu hover:bg-white/5">
        <p className="text-2xl sm:text-3xl font-black text-orange-400 tracking-tighter truncate w-full flex items-center justify-center gap-1">
          {memoizedStats.streak} <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
        </p>
        <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-[0.1em] font-bold mt-0.5 max-w-full truncate px-1">Current Streak</p>
      </div>
    </div>

    {/* Rotation Circle (Always at the bottom of the content now) */}
    <Suspense fallback={null}>
      <RotationCircle 
        currentUser={currentUser || "You"} 
        onAddRotation={async (rotationData) => {
          const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
          try {
            const res = await fetch(`${backendUrl}/api/rotation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(rotationData)
            });
            if (res.ok) onDrinkSelect({ id: rotationData.bluntType, date: new Date().toISOString().split('T')[0] });
          } catch (e) { console.error(e); }
        }}
        isLoading={isTransitioning}
      />
    </Suspense>
  </div>
));
HomeView.displayName = 'HomeView';

const AnalyticsView = React.memo(({ isTransitioning, chartView, handleChartViewChange, memoizedStats, chartOptions, chartData, selectedChartDate, consumptionData, deletingDrink, handleDeleteDrink, chartRef, chartMonthOffset, setChartMonthOffset, setSelectedChartDate, mockData }) => (
  <div className="mt-4 bg-gray-950/40 rounded-[40px] p-6 md:p-10 border border-white/5 shadow-2xl space-y-10 overflow-hidden animate-in fade-in duration-500">
    <div className="flex flex-col items-center gap-6 mb-8 text-center pt-4 md:pt-6">
      <h2 className="text-3xl sm:text-4xl md:text-6xl blunt-title text-white w-full leading-normal">Consumption Stats</h2>
      <div className='flex gap-2 bg-gray-950/60 p-1.5 rounded-2xl border border-white/10 shadow-lg shrink-0'>
        <button onClick={() => handleChartViewChange('daily')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 transform-gpu ${chartView === 'daily' ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'text-gray-500 hover:text-white'}`}>Daily</button>
        <button onClick={() => handleChartViewChange('annual')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 transform-gpu ${chartView === 'annual' ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'text-gray-500 hover:text-white'}`}>Annual</button>
      </div>
    </div>

    {/* Lifetime Extra Stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
      <div className="bg-gray-950/60 p-4 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden group">
        <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mb-1 relative z-10 w-full truncate">Total Blunts</p>
        <p className="text-2xl sm:text-3xl font-black text-[#2eef6a] relative z-10 font-mono">{memoizedStats.totalBlunts || 0}</p>
      </div>
      <div className="bg-gray-950/60 p-4 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden group">
        <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mb-1 relative z-10 w-full truncate">Total Invested</p>
        <p className="text-2xl sm:text-3xl font-black text-yellow-400 relative z-10 font-mono">{(memoizedStats.totalCost || 0).toFixed(0)}€</p>
      </div>
      <div className="bg-gray-950/60 p-4 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden group">
        <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mb-1 relative z-10 w-full truncate">Active Days</p>
        <p className="text-2xl sm:text-3xl font-black text-orange-400 relative z-10 font-mono">{memoizedStats.streak || 0}</p>
      </div>
      <div className="bg-gray-950/60 p-4 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden group">
        <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mb-1 relative z-10 w-full truncate">Levels Gained</p>
        <p className="text-2xl sm:text-3xl font-black text-purple-400 relative z-10 font-mono">{memoizedStats.currentLevel.level || 1}</p>
      </div>
    </div>

    {chartView === 'daily' && (
      <div className='flex items-center justify-center gap-4 mb-4'>
        <button onClick={() => { setChartMonthOffset(prev => prev - 1); setSelectedChartDate(null); }} className='p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors'><ChevronLeft className="w-6 h-6" /></button>
        <span className='text-xl md:text-2xl font-bold text-white min-w-[180px] text-center'>
          {(() => {
            const d = new Date(); d.setMonth(d.getMonth() + chartMonthOffset);
            return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
          })()}
        </span>
        <button onClick={() => { setChartMonthOffset(prev => prev + 1); setSelectedChartDate(null); }} className='p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors'><ChevronRight className="w-6 h-6" /></button>
      </div>
    )}

    {/* Main Chart Card */}
    <div className="bg-gray-950/60 p-4 md:p-8 rounded-[32px] border border-white/10 shadow-2xl relative">
      <div className={`h-[300px] md:h-[450px] relative transition-all duration-500 transform-gpu ${isTransitioning ? 'blur-md grayscale opacity-50 scale-95' : 'blur-0 grayscale-0 opacity-100 scale-100'}`}>
        {chartOptions && chartData && (
          <Line ref={chartRef} options={chartOptions} data={chartData} />
        )}
      </div>

      {/* Selected Day Details */}
      {chartView === 'daily' && selectedChartDate && (
        <div className="mt-8 border-t border-white/5 pt-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2" style={{ fontFamily: 'var(--font-primary)' }}>
              <Calendar className="w-5 h-5 text-green-500" />
              {selectedChartDate === new Date().toISOString().split('T')[0] ? 'Sessions Today' : selectedChartDate}
            </h3>
            <button onClick={() => setSelectedChartDate(null)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors"><X className="w-5 h-5" /></button>
          </div>

          <div className="space-y-3">
             {((consumptionData.find(d => d.date === selectedChartDate)?.blunts || []).length === 0) ? (
               <div className="text-center py-10 text-gray-600 bg-black/20 rounded-2xl border border-dashed border-white/5 italic">
                 No sessions recorded for this date.
               </div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {(consumptionData.find(d => d.date === selectedChartDate)?.blunts || []).map((blunt, idx) => (
                   <div 
                     key={idx}
                     className={`bg-gray-900/40 p-4 rounded-2xl flex items-center gap-4 relative border border-white/5 ${deletingDrink === idx ? 'opacity-50 scale-95 blur-sm' : 'hover:bg-white/5'}`}
                   >
                     <img src="fav.jpg" className="w-10 h-10 rounded-xl" />
                     <div className="flex-1 overflow-hidden">
                       <p className="font-bold text-white truncate">{mockData.bluntDrinks.find(d => d.id === blunt.id)?.name || 'Blunt'}</p>
                       <p className="text-[10px] text-green-400 font-bold tracking-widest uppercase">📍 {blunt.spot || 'Unknown Spot'}</p>
                     </div>
                     <button
                       onClick={() => handleDeleteDrink(idx, selectedChartDate)}
                       disabled={deletingDrink === idx}
                       className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors transform-gpu"
                       title="Delete Blunt"
                     >
                       <Trash2 className="w-5 h-5" />
                     </button>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  </div>
));
AnalyticsView.displayName = 'AnalyticsView';

const LeaderboardView = React.memo(({ leaderboardData, getPlayerRankInfo }) => (
  <div className="mt-4 bg-gray-950/40 rounded-[40px] p-6 md:p-10 border border-white/5 shadow-2xl space-y-10 overflow-hidden animate-in fade-in duration-500">
    <div className="text-center mb-8">
      <h2 className="text-4xl blunt-title text-white tracking-widest mb-2">The Elite Circle</h2>
      <p className="text-yellow-400/80 text-xs font-bold uppercase tracking-[0.3em]">Top Ranking Commanders</p>
    </div>
    
    {/* Podium Top 3 View */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {leaderboardData.slice(0, 3).map((user, index) => {
        const rank = index + 1;
        const isFirst = rank === 1;
        const rankInfo = getPlayerRankInfo(user.totalBlunts || 0);

        return (
          <div 
            key={user.username}
            className={`relative flex flex-col items-center p-6 sm:p-8 rounded-2xl border backdrop-blur-lg overflow-hidden transition-all duration-500 hover:scale-[1.02] ${
              isFirst 
                ? 'md:-mt-4 bg-gradient-to-b from-yellow-500/20 to-gray-950/80 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]' 
                : rank === 2
                  ? 'bg-gradient-to-b from-gray-400/20 to-gray-950/80 border-gray-400/30'
                  : 'bg-gradient-to-b from-amber-700/20 to-gray-950/80 border-amber-700/30'
            }`}
          >
            {isFirst && <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300"></div>}
            
            <div className="relative flex flex-row items-start justify-center w-full gap-4 sm:gap-6 mt-4 mb-4">
              {/* Left Medals */}
              <div className="flex flex-row-reverse gap-2 z-20 items-start">
                {(() => {
                  const medals = (user.optional_achievements || []).filter((_, i) => i % 2 === 0);
                  const chunks = [];
                  for (let i = 0; i < medals.length; i += 4) chunks.push(medals.slice(i, i + 4));
                  return chunks.map((chunk, ci) => (
                    <div key={ci} className="flex flex-col gap-2">
                      {chunk.map(m => (
                        <div key={m.id} className="text-base sm:text-lg filter drop-shadow-md bg-black/20 p-1 rounded-lg border border-white/5" title={m.name}>
                          {m.icon}
                        </div>
                      ))}
                    </div>
                  ));
                })()}
              </div>

              {/* Center Section: Image + Name */}
              <div className="flex flex-col items-center">
                <div className="mb-2">
                  <img 
                    src={`/blunt-images/${isFirst ? 'corona_dorada' : rank === 2 ? 'corona_plata' : 'corona_cobre'}.png`} 
                    alt="Crown Rank"
                    className="object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.4)] w-16 h-16 md:w-20 md:h-20"
                  />
                </div>
                
                <h3 className={`blunt-title text-3xl md:text-4xl tracking-wide truncate max-w-[150px] text-center ${user.username === 'lil.nia_' ? 'text-pink-300' : isFirst ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : ''}`}>
                  {user.username}
                </h3>
              </div>

              {/* Right Medals */}
              <div className="flex flex-row gap-2 z-20 items-start">
                {(() => {
                  const medals = (user.optional_achievements || []).filter((_, i) => i % 2 !== 0);
                  const chunks = [];
                  for (let i = 0; i < medals.length; i += 4) chunks.push(medals.slice(i, i + 4));
                  return chunks.map((chunk, ci) => (
                    <div key={ci} className="flex flex-col gap-2">
                      {chunk.map(m => (
                        <div key={m.id} className="text-base sm:text-lg filter drop-shadow-md bg-black/20 p-1 rounded-lg border border-white/5" title={m.name}>
                          {m.icon}
                        </div>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            </div>

            <p className={`flex justify-center items-center gap-1 text-[11px] font-bold mt-0.5 ${rankInfo.textClass}`}>
              <Star className={`w-3 h-3 ${rankInfo.iconClass}`} /> {rankInfo.title}
            </p>
            
            <div className="mt-1 text-center">
              <div className={`text-3xl font-black tracking-tighter ${isFirst ? 'text-yellow-400' : 'text-white'}`}>
                {user.totalBlunts}
              </div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">Blunts Smoked</p>
            </div>

            <div className="w-full mt-4 space-y-1.5 border-t border-white/5 pt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 flex items-center gap-1 text-[13px]"><Coins className="w-4 h-4" /> Spent</span>
                <span className="font-mono text-gray-200 text-[13px]">{(user.totalSpent || 0).toFixed(2)}€</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 flex items-center gap-1 text-[13px]"><Flame className="w-4 h-4 text-orange-500" /> Avg/Week</span>
                <span className="font-mono text-gray-200 text-[13px]">{(user.totalBlunts / (user.totalWeeks || 1)).toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 flex items-center gap-1 text-[13px]"><MapPin className="w-4 h-4 text-blue-500" /> Top Spot</span>
                <span className="font-mono text-gray-200 text-[13px] truncate max-w-[120px]" title={user.topSpot}>{user.topSpot || 'None'}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-gray-800/50">
                <span className="text-gray-400 flex items-center gap-1 text-[13px]"><Zap className="w-4 h-4 text-purple-500" /> Max Streak</span>
                <span className="font-mono text-gray-200 text-[13px]">{user.maxStreak || 0} Days</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-0.5">
                <span className="text-gray-500 flex items-center gap-1 text-[11px]"><Flame className="w-3 h-3 text-red-500/80" /> Current Streak</span>
                <span className="font-mono text-gray-400 text-[11px]">{user.currentStreak || 0} Days</span>
              </div>
              
              {user.topBuddies && user.topBuddies.length > 0 && (
                <div className="flex flex-col items-center justify-center text-sm mt-2 pt-2 border-t border-gray-800/50">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Rotation Buddies</span>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {user.topBuddies.slice(0, 3).map((b, bIdx) => (
                      <span key={bIdx} className="bg-gray-800/80 text-[10px] text-gray-300 px-2 py-0.5 rounded-full border border-gray-700/50">
                        {b.username} ({b.sessions})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>

    {/* The Rest of the Ladder */}
    {leaderboardData.length > 3 && (
      <div className="bg-gray-950/60 rounded-2xl border border-white/5 overflow-hidden shadow-xl mb-[100px]">
        <div className="grid grid-cols-5 gap-1 sm:gap-2 md:gap-4 p-4 sm:p-6 text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 bg-black/40">
          <div className="col-span-2 pl-1 sm:pl-2">Dominator</div>
          <div className="text-center">Blunts</div>
          <div className="text-center">Avg/Week</div>
          <div className="text-right pr-1 sm:pr-2">Level</div>
        </div>
        
        <div className="divide-y divide-white/5">
          {leaderboardData.slice(3).map((user, idx) => {
            const rankInfo = getPlayerRankInfo(user.totalBlunts || 0);
            return (
              <div 
                key={user.username}
                className="grid grid-cols-5 gap-1 sm:gap-2 md:gap-4 p-4 sm:p-6 items-center hover:bg-white/5 transition-colors"
              >
                <div className="col-span-2 flex items-center gap-2 md:gap-4 overflow-hidden">
                  <span className="text-gray-500 font-mono text-xs">#{idx + 4}</span>
                  <span className={`font-bold text-xs sm:text-lg md:text-2xl truncate ${user.username === 'lil.nia_' ? 'text-pink-300' : 'text-gray-200'}`}>
                    {user.username}
                  </span>
                </div>
                <div className="text-center font-black text-white text-sm sm:text-xl md:text-2xl h-full flex items-center justify-center">
                  {user.totalBlunts || 0}
                </div>
                <div className="text-center font-mono text-gray-400 text-[10px] sm:text-sm h-full flex items-center justify-center">
                  {(user.totalBlunts / (user.totalWeeks || 1)).toFixed(1)}
                </div>
                <div className="text-right flex items-center justify-end gap-1 font-medium text-[8px] sm:text-[10px] md:text-xs h-full">
                  <span className={`${rankInfo.textClass} truncate max-w-[40px] md:max-w-[120px]`}>{rankInfo.title}</span>
                  <Star className={`w-3 h-3 ${rankInfo.iconClass}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>
));
LeaderboardView.displayName = 'LeaderboardView';

const TrophiesView = React.memo(({ memoizedStats, onTrophyClick }) => (
  <div className="mt-4 bg-gray-950/40 rounded-[40px] p-6 md:p-10 border border-white/5 shadow-2xl space-y-10 overflow-hidden animate-in fade-in duration-500">
    <div className="text-center mb-6">
      <h2 className="text-4xl blunt-title text-white mb-2">Missions & Trophies</h2>
      <div className="flex items-center justify-center gap-3">
        <span className="text-3xl">{memoizedStats.currentLevel.badge}</span>
        <p className="text-sm font-black text-[#2eef6a] uppercase tracking-widest bg-[#2eef6a]/10 px-4 py-1.5 rounded-full border border-[#2eef6a]/30">Level {memoizedStats.currentLevel.level}: {memoizedStats.currentLevel.name}</p>
      </div>

      {/* Next Level Progress Bar */}
      {(() => {
        const nextLevelDef = mockData.bluntLevels.find(l => l.level === memoizedStats.currentLevel.level + 1);
        if (!nextLevelDef) return null;

        const currentMin = memoizedStats.currentLevel.minBlunts;
        const nextMin = nextLevelDef.minBlunts;
        const totalBlunts = memoizedStats.totalBlunts;
        
        // Calculate progress percentage within the current level's range to next
        const progress = Math.min(100, Math.max(0, ((totalBlunts - currentMin) / (nextMin - currentMin)) * 100));
        const bluntsRemaining = Math.max(0, nextMin - totalBlunts);

        return (
          <div className="max-w-md mx-auto w-full px-4 -mt-4 mb-2 animate-in fade-in slide-in-from-top-2 duration-700">
            <div className="flex justify-between items-end mb-1.5 px-1">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Next Level Progress</span>
              <span className="text-[10px] font-black text-[#2eef6a] uppercase tracking-tighter">
                {bluntsRemaining} {bluntsRemaining === 1 ? 'Blunt' : 'Blunts'} to Level {nextLevelDef.level}
              </span>
            </div>
            <div className="h-2 w-full bg-gray-950/60 rounded-full border border-white/5 overflow-hidden p-[2px] shadow-inner">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#2eef6a]/40 to-[#2eef6a] rounded-full shadow-[0_0_10px_rgba(46,239,106,0.3)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        );
      })()}
    </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#2eef6a]/40 to-transparent" />

    {/* Ascension Box */}
    <div className="bg-gray-950/60 border border-white/10 rounded-[28px] p-6 mb-8 shadow-inner">
      <div className="text-center mb-5">
         <h2 className="text-xl font-bold text-white">Next Level Milestones</h2>
         <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Ascension to Level {memoizedStats.currentLevel.level + 1}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {(memoizedStats.achievements[memoizedStats.currentLevel.level] || []).map((trophy) => (
          <motion.div 
            key={trophy.id}
            onClick={() => onTrophyClick?.(trophy)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`cursor-pointer rounded-[20px] p-3 sm:p-4 flex flex-col items-center text-center relative transition-all duration-300 transform-gpu border ${trophy.achieved ? 'border-[#2eef6a]/50 bg-[#2eef6a]/10 shadow-inner' : 'border-white/5 bg-gray-950/40'}`}
          >
            <div className={`text-2xl sm:text-4xl mb-2 sm:mb-3 ${trophy.achieved ? 'animate-bounce-short' : 'grayscale opacity-30'}`}>{trophy.icon}</div>
            <p className="text-[9px] sm:text-xs font-black text-white mb-2 leading-tight uppercase truncate w-full">{trophy.name}</p>
            <div className="w-full mt-auto">
              <div className="flex justify-between text-[7px] sm:text-[8px] uppercase tracking-widest font-black text-gray-500 mb-1">
                <span>{Math.floor(trophy.percentage)}%</span>
              </div>
              <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${trophy.achieved ? 'bg-[#2eef6a]' : 'bg-gray-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${trophy.percentage}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>

    {/* Optional Achievements */}
    <div className="bg-gray-950/60 border border-white/10 rounded-[28px] p-6 sm:p-8 shadow-inner">
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-yellow-500">Optional Achievements</h2>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Special Medals & Prestige</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {(memoizedStats.achievements['optional'] || []).map((trophy) => (
          <motion.div 
            key={trophy.id}
            onClick={() => onTrophyClick?.(trophy)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`cursor-pointer rounded-[20px] p-3 sm:p-4 border flex flex-col items-center text-center transition-all duration-300 transform-gpu ${trophy.achieved ? 'border-yellow-500/50 bg-yellow-500/10 shadow-lg' : 'border-white/5 bg-gray-950/40 opacity-40'}`}
          >
            <div className="text-3xl sm:text-4xl mb-2">{trophy.icon}</div>
            <p className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest">{trophy.name}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
));
TrophiesView.displayName = 'TrophiesView';

const Dashboard = React.memo(
  ({
    consumptionData,
    goals,
    bestStreak,
    setBestStreak,
    onDrinkSelect,
    selectedDrinks,
    onDrinkDelete,
    currentUser,
    leaderboardData = [],
    onRefreshLeaderboard,
  }) => {
    const [chartView, setChartView] = useState('daily');
    const [chartMonthOffset, setChartMonthOffset] = useState(0);
    const [selectedChartDate, setSelectedChartDate] = useState(null);
    const [hasAutoSelectedToday, setHasAutoSelectedToday] = useState(false);
    const [todayQuote, setTodayQuote] = useState('');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [deletingDrink, setDeletingDrink] = useState(null);
    const [showAIInsights, setShowAIInsights] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const [selectedTrophy, setSelectedTrophy] = useState(null);
    const chartRef = useRef(null);

    useEffect(() => {
      setTodayQuote(mockData.getTodayQuote());
    }, []);

    // Auto-select today if there are hits
    useEffect(() => {
      if (consumptionData && consumptionData.length > 0 && !hasAutoSelectedToday) {
        const todayStr = new Date().toISOString().split('T')[0];
        const hasTodayBlunts = consumptionData.some(d => d.date === todayStr && d.totalBlunts > 0);
        if (hasTodayBlunts) {
          setSelectedChartDate(todayStr);
        }
        setHasAutoSelectedToday(true);
      }
    }, [consumptionData, hasAutoSelectedToday]);

    // Instant scroll to top when changing tabs for better response
    useEffect(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [activeTab]);

    // Debounced best streak update to prevent excessive recalculations
    const debouncedUpdateBestStreak = useRef(
      debounce((data, currentBest, setter) => {
        const currentBestStreak = mockData.calculateBestStreak(data);
        setter(currentBestStreak);
      }, 300)
    ).current;

    useEffect(() => {
      debouncedUpdateBestStreak(consumptionData, bestStreak, setBestStreak);
    }, [consumptionData, bestStreak, setBestStreak, debouncedUpdateBestStreak]);

    const today = new Date().toISOString().split('T')[0];
    const todayData = consumptionData.find((d) => d.date === today) || {
      blunts: [],
      totalBlunts: 0,
    };

    // Memoize expensive calculations
    const memoizedStats = React.useMemo(
      () => {
        const totalBlunts = calculateTotalBlunts(consumptionData);
        const achievements = calculateAchievements(consumptionData, currentUser);
        const currentLevel = mockData.getBluntLevel(totalBlunts, achievements);
        
        return {
          totalBlunts,
          currentLevel,
          streak: mockData.calculateStreak(consumptionData),
          totalCost: calculateTotalCost(consumptionData),
          achievements
        };
      },
      [consumptionData, currentUser]
    );

    // Determine if current user is Top 1
    const isTop1 = React.useMemo(() => {
      if (!leaderboardData || leaderboardData.length === 0) return false;
      const sorted = [...leaderboardData].sort((a, b) => (b.totalBlunts || 0) - (a.totalBlunts || 0));
      return sorted[0]?.username === currentUser;
    }, [leaderboardData, currentUser]);

    const handleChartViewChange = React.useCallback(
      async (newView) => {
        if (newView === chartView) return;

        setIsTransitioning(true);

        // Small delay to allow for smooth transition
        setTimeout(() => {
          setChartView(newView);
          setIsTransitioning(false);
        }, 150);
      },
      [chartView]
    );

    const handleDeleteDrink = React.useCallback(
      async (drinkIndex, specificDate = null) => {
        setDeletingDrink(drinkIndex);

        // Add smooth animation delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        if (onDrinkDelete) {
          onDrinkDelete(drinkIndex, specificDate);
        }

        setDeletingDrink(null);
      },
      [onDrinkDelete]
    );

    // Memoize chart data to prevent unnecessary recalculations
    const chartData_full = React.useMemo(
      () => mockData.getChartData(consumptionData, chartView, chartMonthOffset),
      [consumptionData, chartView, chartMonthOffset]
    );

    const chartData = React.useMemo(
      () => ({
        labels: chartData_full.map((d) => d.label),
        datasets: [
          {
            label: 'Blunts',
            data: chartData_full.map((d) => d.bluntCount),
            borderColor: '#00ff41',
            backgroundColor: 'rgba(0, 255, 65, 0.1)',
            tension: 0.4,
            fill: false,
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#00ff41',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#00ff41',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 3,
          },
        ],
      }),
      [chartData_full]
    );

    const chartOptions = React.useMemo(
      () => ({
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements, chart) => {
          if (chartView !== 'daily') return;
          if (!elements || elements.length === 0) return;
          
          const element = elements[0];
          const dataIndex = element.index;
          const chartDataEntry = chartData_full[dataIndex];
          
          if (chartDataEntry && chartDataEntry.date) {
            setSelectedChartDate(chartDataEntry.date);
          }
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            titleColor: '#00ff41',
            bodyColor: '#ffffff',
            borderColor: '#00ff41',
            borderWidth: 1,
            cornerRadius: 8,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            callbacks: {
              label: function (context) {
                const value = Math.max(0, context.parsed.y);
                const dataIndex = context.dataIndex;
                const chartDataEntry = chartData_full[dataIndex];
                
                if (chartView === 'annual' && chartDataEntry) {
                  return [
                    `Total: ${chartDataEntry.bluntCount} Blunts`,
                    `Avg: ${(parseFloat(chartDataEntry.avgBlunts) * 7).toFixed(1)} per week`
                  ];
                }
                let bluntNames = '';
                if (
                  chartView === 'daily' &&
                  chartDataEntry &&
                  chartDataEntry.date
                ) {
                  // Buscar en consumptionData el día y obtener los nombres
                  const dayData = consumptionData.find(
                    (d) => d.date === chartDataEntry.date
                  );
                  if (dayData && dayData.blunts && dayData.blunts.length > 0) {
                    bluntNames = dayData.blunts
                      .map((blunt) => {
                        const bluntInfo = mockData.bluntDrinks.find(
                          (m) => m.id === blunt.id
                        );
                        return bluntInfo
                          ? bluntNameShortMap[bluntInfo.name] || 'Blunt'
                          : 'Blunt';
                      })
                      .join('\n'); // Mostrar cada Blunt en una línea
                  }
                }
                let label = `${value}`;
                if (bluntNames) {
                  // Si hay nombres, devolver solo los nombres, sin el número arriba
                  const namesArr = bluntNames.split('\n');
                  // Contar cuántas veces aparece cada Blunt
                  const counts = {};
                  namesArr.forEach((name) => {
                    counts[name] = (counts[name] || 0) + 1;
                  });
                  // Construir el array con el formato: Nombre xN si hay más de uno
                  const formatted = Object.entries(counts).map(
                    ([name, count]) => (count > 1 ? `${name} x${count}` : name)
                  );
                  // Añadir coma al final de cada línea excepto la última si hay más de una Blunt
                  if (formatted.length > 1) {
                    return formatted.map((name, idx) =>
                      idx < formatted.length - 1 ? name + ',' : name
                    );
                  } else {
                    return formatted;
                  }
                }
                return label;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              drawBorder: false,
            },
            border: {
              display: false,
            },
            ticks: {
              color: '#9CA3AF',
              font: {
                size: 11,
                family: 'Inter, sans-serif',
              },
              callback: function (value) {
                const safeValue = Math.max(0, Math.floor(value));
                return safeValue;
              },
              stepSize: 1,
              maxTicksLimit: 6,
            },
          },
          x: {
            grid: {
              display: false,
            },
            border: {
              display: false,
            },
            ticks: {
              color: '#9CA3AF',
              font: {
                size: 11,
                family: 'Inter, sans-serif',
              },
              maxRotation: 0,
              maxTicksLimit: chartView === 'daily' ? 15 : 12,
            },
          },
        },
        elements: {
          point: {
            hoverBackgroundColor: '#00ff41',
            hoverBorderColor: '#ffffff',
          },
          line: {
            tension: 0.4,
          },
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart',
        },
      }),
      [chartView, chartData_full, consumptionData]
    );

    return (
      <div className="min-h-screen relative pb-32 pt-6 transition-colors duration-700 transform-gpu">
        
        {/* Global Shimmer for Top 1 */}
        {isTop1 && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
             {/* Pure CSS Hardware Accelerated Shimmer, moderately blurred for elegance but more visible */}
             <div className="absolute top-0 -left-1/2 w-[200%] h-[600px] bg-gradient-to-r from-transparent via-yellow-500/25 to-transparent blur-2xl opacity-40 animate-gold-shimmer transform-gpu" />
          </div>
        )}

        {/* --- Main Content Area --- */}
        <div className="max-w-7xl mx-auto px-4 pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }} // Simplified animation
              animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'linear' }}
              className="space-y-6 transform-gpu"
              style={{ willChange: 'opacity' }}
            >
                    {/* --- HOME VIEW --- */}
              {activeTab === 'home' && (
                <HomeView 
                  todayQuote={todayQuote}
                  leaderboardData={leaderboardData}
                  memoizedStats={memoizedStats}
                  todayData={todayData}
                  currentUser={currentUser}
                  onDrinkSelect={onDrinkSelect}
                  isTransitioning={isTransitioning}
                />
              )}

              {/* --- ANALYTICS VIEW --- */}
              {activeTab === 'analytics' && (
                <AnalyticsView 
                  isTransitioning={isTransitioning}
                  chartView={chartView}
                  handleChartViewChange={handleChartViewChange}
                  memoizedStats={memoizedStats}
                  chartOptions={chartOptions}
                  chartData={chartData}
                  selectedChartDate={selectedChartDate}
                  consumptionData={consumptionData} // Added this prop
                  deletingDrink={deletingDrink}
                  handleDeleteDrink={handleDeleteDrink}
                  chartRef={chartRef}
                  chartMonthOffset={chartMonthOffset} // Added this prop
                  setChartMonthOffset={setChartMonthOffset} // Added this prop
                  setSelectedChartDate={setSelectedChartDate} // Added this prop
                  mockData={mockData} // Added this prop
                />
              )}
              {/* --- LEADERBOARD VIEW --- */}
              {activeTab === 'leaderboard' && (
                <LeaderboardView 
                  leaderboardData={leaderboardData}
                  getPlayerRankInfo={getPlayerRankInfo}
                />
              )}
              {/* --- TROPHIES VIEW --- */}
              {activeTab === 'trophies' && (
                <TrophiesView 
                  memoizedStats={memoizedStats} 
                  onTrophyClick={setSelectedTrophy}
                />
              )}

              {/* --- AI INSIGHTS VIEW --- */}
              {activeTab === 'insights' && (
                <div className="animate-in fade-in duration-500">
                  <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" /></div>}>
                    <AIInsightsPanel
                      consumptionData={consumptionData}
                      leaderboardData={leaderboardData || []}
                      currentLevel={memoizedStats.currentLevel}
                      isVisible={true}
                    />
                  </Suspense>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

        </div>

        <BottomNavbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Achievement Detail Modal - Using Portal for correct viewport centering */}
        {selectedTrophy && createPortal(
          <AnimatePresence>
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-hidden touch-none">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedTrophy(null)}
                className="absolute inset-0 bg-black/50 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-[340px] xs:max-w-md bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] transform-gpu z-50"
              >
                <div className={`absolute top-0 left-0 w-full h-32 opacity-20 bg-gradient-to-b ${selectedTrophy.achieved ? 'from-green-500' : 'from-yellow-500'}`} />
                
                <div className="relative p-6 xs:p-8 flex flex-col items-center text-center">
                  <button 
                    onClick={() => setSelectedTrophy(null)}
                    className="absolute top-4 right-4 xs:top-6 xs:right-6 p-2 text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className={`text-6xl xs:text-7xl mb-4 xs:mb-6 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] ${selectedTrophy.achieved ? 'animate-bounce-short' : 'grayscale opacity-50'}`}>
                    {selectedTrophy.icon}
                  </div>

                  <h3 
                    className="text-2xl xs:text-3xl font-black text-white mb-2"
                    style={{ fontFamily: "'UnifrakturMaguntia', cursive" }}
                  >
                    {selectedTrophy.name}
                  </h3>
                  
                  <div className={`px-4 py-1 rounded-full text-[9px] xs:text-[10px] font-black uppercase tracking-[0.2em] mb-4 xs:mb-6 border ${selectedTrophy.achieved ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500/70'}`}>
                    {selectedTrophy.achieved ? 'Achievement Unlocked' : 'Mission in Progress'}
                  </div>

                  <p className="text-gray-300 text-xs xs:text-sm leading-relaxed mb-6 xs:mb-8 px-2 xs:px-4 font-medium">
                    {selectedTrophy.description}
                  </p>

                  <div className="w-full bg-black/40 rounded-3xl p-4 xs:p-6 border border-white/5 shadow-inner">
                    <div className="flex justify-between items-end mb-2 xs:mb-3">
                      <span className="text-[8px] xs:text-[10px] text-gray-500 font-black uppercase tracking-widest">Progress</span>
                      <span className="text-lg xs:text-xl font-black text-white">{Math.floor(selectedTrophy.percentage)}%</span>
                    </div>
                    
                    <div className="w-full h-2 xs:h-3 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        className={`h-full shadow-[0_0_10px_rgba(46,239,106,0.3)] ${selectedTrophy.achieved ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-yellow-600 to-amber-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedTrophy.percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    
                    <p className="text-[8px] xs:text-[10px] text-gray-500 mt-3 xs:mt-4 uppercase tracking-widest font-bold">
                      {selectedTrophy.progress} / {selectedTrophy.goal} {selectedTrophy.type.replace(/_/g, ' ')}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedTrophy(null)}
                    className="mt-6 xs:mt-8 w-full py-3 xs:py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            </div>
          </AnimatePresence>,
          document.body
        )}
      </div>
    );
  }
);

Dashboard.displayName = 'Dashboard';

export default Dashboard;
