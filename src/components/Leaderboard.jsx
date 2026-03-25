import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Trophy, Flame, Coins, MapPin, Star, Zap } from 'lucide-react';
import Loader from './ui/Loader';
import { bluntDrinks } from '../data/mockData';

const getDrinkName = (id) => bluntDrinks.find(d => String(d.id) === String(id))?.name || 'Unknown';
const getShortName = (name) => name ? name.replace(/Blunt Energy /gi, "").trim() : "";

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

const RankBadge = ({ rank }) => {
  let badgeClasses = "";
  let textClasses = "";
  
  if (rank === 1) {
    badgeClasses = "bg-yellow-500/20 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]";
    textClasses = "text-yellow-400";
  } else if (rank === 2) {
    badgeClasses = "bg-gray-300/20 border-gray-300 shadow-[0_0_15px_rgba(209,213,219,0.3)]";
    textClasses = "text-gray-200";
  } else if (rank === 3) {
    badgeClasses = "bg-amber-700/30 border-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.2)]";
    textClasses = "text-amber-500";
  } else {
    return null; // Don't show numeric badge for ranks > 3 as requested
  }

  return (
    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black ${badgeClasses}`}>
      <span className={textClasses}>{rank}</span>
    </div>
  );
};

export default function Leaderboard({ onClose }) {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Block background scroll when the modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
        const res = await fetch(`${backendUrl}/api/leaderboard?t=${Date.now()}`, {
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (!res.ok) throw new Error('Failed to fetch Leaderboard data');
        
        const data = await res.json();
        setLeaderboardData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-sm'>
      <motion.div 
        className='bg-[#0d0d0d] w-full max-w-4xl max-h-[85vh] md:max-h-[90vh] rounded-3xl border border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.15)] overflow-hidden flex flex-col relative my-auto'
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Header (Image_9 Style) */}
        <div className='p-4 md:p-6 border-b border-white/5 flex justify-between items-center bg-gray-950 px-8 relative z-50'>
          <div className='flex items-center gap-5'>
            <div className="p-3 bg-yellow-500 rounded-2xl shadow-[0_0_20px_rgba(234,179,8,0.4)] flex-shrink-0">
               <Trophy className='w-7 h-7 text-black' strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl md:text-4xl blunt-title text-[#2ecc71] drop-shadow-sm">Top Smokers</h2>
              <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mt-0.5">The most legendary lungs in the community</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className='p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-all duration-300'
          >
            <X className='w-6 h-6' />
          </button>
        </div>

        {/* Content (Image_9 Style) */}
        <div className='flex-1 overflow-y-auto p-4 md:p-8 relative' style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#2eef6a transparent'
        }}>
          <style>{`
            .custom-leaderboard-scroll::-webkit-scrollbar { width: 6px; }
            .custom-leaderboard-scroll::-webkit-scrollbar-track { background: transparent; }
            .custom-leaderboard-scroll::-webkit-scrollbar-thumb { background: #2eef6a; border-radius: 20px; box-shadow: 0 0 10px #2eef6a; }
          `}</style>
          <div className="custom-leaderboard-scroll h-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader />
              <p className="mt-4 text-gray-500 font-mono animate-pulse">Calculating Global Rankings...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-8 bg-red-500/10 rounded-2xl border border-red-500/20">
              <p className="font-bold mb-2">Error Connection</p>
              <p>{error}</p>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="text-center text-gray-400 p-12">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl">The ladder is empty.</p>
              <p className="text-sm mt-2 opacity-50">Log your first blunt to claim the crown.</p>
            </div>
          ) : (
            <div className="space-y-6 px-4 pb-8">
              {leaderboardData
                .sort((a, b) => (b.totalBluntsCount || 0) - (a.totalBluntsCount || 0))
                .map((user, index) => {
                  const rankInfo = getPlayerRankInfo(user.totalBluntsCount || 0);
                  const isFirst = index === 0;
                  
                  return (
                    <motion.div 
                      key={user.username}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative w-full max-w-2xl mx-auto rounded-[40px] border border-[#f59e0b]/20 bg-black/90 p-8 shadow-2xl overflow-hidden group`}
                    >
                      {/* Top Neon Border Highlight (Image_9 Style) */}
                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${isFirst ? 'bg-yellow-400 shadow-[0_4px_25px_rgba(234,179,8,0.8)]' : 'bg-gray-800 opacity-30 shadow-none'}`} />
                      
                      {/* Right Neon Scrollbar-ish detail */}
                      <div className={`absolute top-1/2 -translate-y-1/2 right-1 h-[60%] w-2 rounded-full ${isFirst ? 'bg-[#2eef6a] shadow-[0_0_15px_#2eef6a]' : 'bg-gray-800 opacity-20'}`} />

                      <div className="flex flex-col items-center">
                        {/* Avatar Flanked by Medals Layout */}
                        <div className="relative mb-6 flex flex-row items-center justify-center w-full gap-4 sm:gap-8">
                           
                           {/* Left Medals */}
                           <div className="flex flex-col gap-3 z-30">
                             {!user.optional_achievements || user.optional_achievements.length === 0 ? (
                               index < 3 && <div className="text-xl opacity-50 filter drop-shadow-md bg-black/40 p-2 rounded-xl" title="No Data">🔴</div>
                             ) : (
                               user.optional_achievements.filter((_, i) => i % 2 === 0).map(m => (
                                 <div key={m.id} className="text-xl sm:text-3xl filter drop-shadow-md bg-black/40 p-2 rounded-xl border border-white/5 shadow-[inset_0_0_15px_rgba(255,255,255,0.02)]" title={m.name}>{m.icon}</div>
                               ))
                             )}
                           </div>

                           {/* Center Avatar */}
                           <div className="relative z-10 p-2 transform group-hover:scale-105 transition-transform duration-500 flex-shrink-0">
                              <img 
                                src={`/blunt-images/${index === 0 ? 'fav_png.png' : 'fav_png.png'}`} 
                                className={`w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-[0_0_20px_rgba(234,179,8,0.4)] ${index > 0 ? 'grayscale opacity-60' : ''}`} 
                                alt="Blunt Profile"
                              />
                           </div>
                           
                           {/* Right Medals */}
                           <div className="flex flex-col gap-3 z-30">
                             {!user.optional_achievements || user.optional_achievements.length === 0 ? (
                               index < 3 && <div className="text-xl opacity-50 filter drop-shadow-md bg-black/40 p-2 rounded-xl" title="No Data">🔴</div>
                             ) : (
                               user.optional_achievements.filter((_, i) => i % 2 !== 0).map(m => (
                                 <div key={m.id} className="text-xl sm:text-3xl filter drop-shadow-md bg-black/40 p-2 rounded-xl border border-white/5 shadow-[inset_0_0_15px_rgba(255,255,255,0.02)]" title={m.name}>{m.icon}</div>
                               ))
                             )}
                           </div>

                           {/* Glow Backdrop */}
                           <div className="absolute inset-0 bg-yellow-500/10 blur-[40px] rounded-full scale-[1.2] transform translate-y-4 pointer-events-none" />
                        </div>

                        {/* Professional Username Section */}
                        <div className="text-center mb-6 z-20 relative">
                           <h3 className={`text-4xl md:text-5xl blunt-title text-white tracking-wide mb-3 drop-shadow-[0_2px_4px_rgba(255,255,255,0.1)]`}>
                             {user.username}
                           </h3>
                           <div className="flex items-center justify-center gap-2">
                             <Star className="w-4 h-4 text-green-400 fill-green-400" />
                             <span className="text-green-400 font-bold uppercase tracking-[0.2em] text-xs pt-0.5">{rankInfo.title}</span>
                           </div>
                        </div>

                        {/* Giant Ranking Number */}
                        <div className="text-center mb-8">
                           <div className="text-6xl md:text-7xl font-black text-yellow-500 leading-none drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                             {user.totalBluntsCount}
                           </div>
                           <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px] md:text-xs mt-3">Blunts Smoked</p>
                        </div>

                        {/* Detailed Stats Interaction Board */}
                        <div className="w-full space-y-4 px-4 md:px-12 max-w-md">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center group/stat">
                              <span className="text-gray-400/80 flex items-center gap-3 text-sm md:text-base"><Coins className="w-5 h-5" /> Spent</span>
                              <span className="font-bold text-white text-base md:text-lg">{(user.totalSpent || 0).toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between items-center group/stat">
                              <span className="text-gray-400/80 flex items-center gap-3 text-sm md:text-base"><Flame className="w-5 h-5 text-orange-500" /> Avg/Week</span>
                              <span className="font-bold text-white text-base md:text-lg">{(user.totalBluntsCount / (user.totalWeeks || 1)).toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between items-center group/stat">
                              <span className="text-gray-400/80 flex items-center gap-3 text-sm md:text-base"><MapPin className="w-5 h-5 text-blue-500" /> Top Spot</span>
                              <span className="font-bold text-white text-base md:text-lg truncate max-w-[150px]">{user.topSpot || 'None'}</span>
                            </div>
                          </div>
                          
                          <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent my-6" />

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-purple-400 flex items-center gap-3 text-sm md:text-base font-bold"><Zap className="w-5 h-5" /> Max Streak</span>
                              <span className="font-bold text-white text-base md:text-lg">{user.maxStreak || 0} Days</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-red-500 flex items-center gap-3 text-sm md:text-base font-bold"><Flame className="w-5 h-5" /> Current Streak</span>
                              <span className="font-bold text-white text-base md:text-lg">{user.currentStreak || 0} Days</span>
                            </div>
                          </div>

                          {/* Rotation Buddies Bubble Section */}
                          {user.topBuddies && user.topBuddies.length > 0 && (
                             <div className="mt-8 pt-8 border-t border-white/5 text-center">
                               <p className="text-gray-500 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs mb-4">Rotation Buddies</p>
                               <div className="flex flex-wrap gap-2 justify-center">
                                 {user.topBuddies.map((b, bIdx) => (
                                   <motion.span 
                                     key={bIdx}
                                     whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                                     className="bg-gray-900/80 border border-white/5 text-[10px] md:text-[11px] text-gray-300 font-bold px-4 py-2 rounded-2xl"
                                   >
                                     {b.username} ({b.sessions})
                                   </motion.span>
                                 ))}
                               </div>
                             </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
    </div>
  );
}
