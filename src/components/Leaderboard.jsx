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
        const res = await fetch(`${backendUrl}/api/leaderboard`, {
          credentials: 'include'
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
        {/* Header */}
        <div className='p-6 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-gray-900 to-[#0d0d0d] relative overflow-hidden'>
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
          
          <div className='flex items-center gap-3 md:gap-4 relative z-10'>
            <div className="p-2 md:p-3 bg-yellow-500/20 rounded-xl border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.4)] flex-shrink-0">
              <Trophy className='w-6 h-6 md:w-8 md:h-8 text-yellow-500' />
            </div>
            <div>
              <h2 className="text-3xl md:text-5xl font-bold leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 blunt-title mb-1 md:mb-2">
                Top Smokers
              </h2>
              <p className="text-gray-400 text-[10px] md:text-sm">The most legendary lungs in the community</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className='p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors relative z-10'
          >
            <X className='w-6 h-6' />
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-2 md:p-6 custom-scrollbar relative'>
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
            <div className="space-y-4">
              {/* Podium Top 3 View */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {leaderboardData.slice(0, 3).map((user, index) => {
                  const rank = index + 1;
                  const isFirst = rank === 1;
                  
                  return (
                    <motion.div 
                      key={user.username}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 }}
                      className={`relative flex flex-col items-center p-6 rounded-2xl border backdrop-blur-lg overflow-hidden ${
                        isFirst 
                          ? 'md:-mt-4 bg-gradient-to-b from-yellow-500/10 to-black border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]' 
                          : rank === 2
                            ? 'bg-gradient-to-b from-gray-300/10 to-black border-gray-400/30'
                            : 'bg-gradient-to-b from-amber-700/10 to-black border-amber-700/30'
                      }`}
                    >
                      {isFirst && <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300"></div>}
                      
                      <div className="mt-2 mb-3 flex justify-center w-full">
                        <img 
                          src={`/blunt-images/${isFirst ? 'corona_dorada' : rank === 2 ? 'corona_plata' : 'corona_cobre'}.png`} 
                          alt="Crown Rank"
                          className="object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.4)] w-20 h-20 md:w-28 md:h-28"
                        />
                      </div>
                      
                      <div className="flex flex-col md:flex-row items-center justify-center w-full">
                        <h3 className={`blunt-title text-4xl md:text-5xl tracking-wide truncate max-w-[90%] text-center ${user.username === 'lil.nia_' ? 'text-pink-300' : isFirst ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : ''}`}>
                          {user.username}
                        </h3>
                      </div>
                      {(() => {
                        const rankInfo = getPlayerRankInfo(user.totalBluntsCount || 0);
                        return (
                          <p className={`flex justify-center items-center gap-1 text-xs font-bold mt-1 ${rankInfo.textClass}`}>
                            <Star className={`w-3 h-3 ${rankInfo.iconClass}`} /> {rankInfo.title}
                          </p>
                        );
                      })()}
                      
                      <div className="mt-4 text-center">
                        <div className={`text-4xl font-black tracking-tighter ${isFirst ? 'text-yellow-400' : 'text-white'}`}>
                          {user.totalBluntsCount}
                        </div>
                        <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Blunts Smoked</p>
                      </div>

                      <div className="w-full mt-6 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 flex items-center gap-1"><Coins className="w-4 h-4" /> Spent</span>
                          <span className="font-mono text-gray-200">{(user.totalSpent || 0).toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 flex items-center gap-1"><Flame className="w-4 h-4 text-orange-500" /> Avg/Day</span>
                          <span className="font-mono text-gray-200">{(user.totalBluntsCount / (user.activeDays || 1)).toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 flex items-center gap-1"><MapPin className="w-4 h-4 text-blue-500" /> Top Spot</span>
                          <span className="font-mono text-gray-200 truncate max-w-[120px]" title={user.topSpot}>{user.topSpot || 'None'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-3 pt-3 border-t border-gray-800/50">
                          <span className="text-gray-400 flex items-center gap-1"><Zap className="w-4 h-4 text-purple-500" /> Max Streak</span>
                          <span className="font-mono text-gray-200">{user.maxStreak || 0} Days</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-1">
                          <span className="text-gray-500 flex items-center gap-1 text-xs"><Flame className="w-3 h-3 text-red-500/80" /> Current Streak</span>
                          <span className="font-mono text-gray-400 text-xs">{user.currentStreak || 0} Days</span>
                        </div>
                        {user.topBuddies && user.topBuddies.length > 0 && (
                          <div className="flex flex-col items-center justify-center text-sm mt-3 pt-3 border-t border-gray-800/50">
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Rotation Buddies</span>
                            <div className="flex flex-wrap gap-1 justify-center">
                              {user.topBuddies.map((b, bIdx) => (
                                <span key={bIdx} className="bg-gray-800/80 text-[10px] text-gray-300 px-2 py-0.5 rounded-full border border-gray-700/50">
                                  {b.username} ({b.sessions})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* The Rest of the Ladder */}
              {leaderboardData.length > 3 && (
                <div className="bg-gray-900/40 rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
                  <div className="grid grid-cols-5 gap-1 sm:gap-2 md:gap-4 p-2 sm:p-4 md:p-5 text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-800 bg-black/40">
                    <div className="col-span-2 pl-1 sm:pl-2">Dominator</div>
                    <div className="text-center">Blunts</div>
                    <div className="text-center">Avg/Day</div>
                    <div className="text-right pr-1 sm:pr-2">Level</div>
                  </div>
                  
                  <div className="divide-y divide-gray-800/50">
                    {leaderboardData.slice(3).map((user, idx) => {
                      const rankInfo = getPlayerRankInfo(user.totalBluntsCount || 0);
                      return (
                        <div 
                          key={user.username}
                          className="grid grid-cols-5 gap-1 sm:gap-2 md:gap-4 p-2 sm:p-4 md:p-5 items-center hover:bg-gray-800/40 transition-colors animate-fade-in-up relative"
                          style={{ animationDelay: `${0.4 + (idx * 0.05)}s` }}
                        >
                          <div className="col-span-2 flex items-center gap-2 md:gap-4 overflow-hidden">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-gray-800/80 border border-gray-700 font-mono text-[10px] sm:text-xs md:text-sm flex shrink-0 items-center justify-center text-gray-400 font-bold shadow-inner">
                              #{idx + 4}
                            </div>
                            <span className={`font-bold text-xs sm:text-lg md:text-2xl truncate ${user.username === 'lil.nia_' ? 'text-pink-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.4)]' : 'text-gray-200'}`}>
                              {user.username}
                            </span>
                          </div>
                          
                          <div className="text-center font-black text-white text-sm sm:text-xl md:text-2xl drop-shadow-sm flex items-center justify-center h-full">
                            {user.totalBluntsCount || 0}
                          </div>
                          
                          <div className="text-center font-mono text-gray-400 text-[10px] sm:text-sm flex items-center justify-center gap-1 h-full">
                            <Flame className="w-3 h-3 text-orange-500/60 hidden sm:block shrink-0" />
                            <span className="truncate">{(user.totalBluntsCount / (user.activeDays || 1)).toFixed(1)}</span>
                          </div>
                          
                          <div className="text-right flex items-center justify-end gap-1 font-medium text-[8px] sm:text-[10px] md:text-xs lg:text-sm overflow-hidden h-full">
                            <span className={`${rankInfo.textClass} truncate max-w-[40px] sm:max-w-[70px] md:max-w-[120px]`} title={rankInfo.title}>{rankInfo.title}</span>
                            <Star className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${rankInfo.iconClass}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
