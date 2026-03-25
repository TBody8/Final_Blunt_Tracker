import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Search, Flame, MapPin, X, Euro } from 'lucide-react';
import { toast } from 'sonner';

const RotationCircle = ({ currentUser, onAddRotation, isLoading }) => {
  const [rotationUsers, setRotationUsers] = useState(() => {
    const saved = localStorage.getItem('bluntRotationData');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.rotationUsers && data.rotationUsers.length > 0) return data.rotationUsers;
      } catch (e) {}
    }
    return [currentUser];
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [spot, setSpot] = useState(() => {
    const saved = localStorage.getItem('bluntRotationData');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.spot !== undefined) return data.spot;
      } catch (e) {}
    }
    return '';
  });
  
  const [spotSearchResults, setSpotSearchResults] = useState([]);
  const [isSearchingSpot, setIsSearchingSpot] = useState(false);
  const [showSpotDropdown, setShowSpotDropdown] = useState(false);
  
  const [isLighterActive, setIsLighterActive] = useState(false);
  const [showDeleteUser, setShowDeleteUser] = useState(null); // Fix for mobile touch tracking
  const [weight, setWeight] = useState(() => {
    const saved = localStorage.getItem('bluntRotationData');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.weight !== undefined) return data.weight;
      } catch (e) {}
    }
    return 0.35;
  });
  
  const [payingUsers, setPayingUsers] = useState(() => {
    const saved = localStorage.getItem('bluntRotationData');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.payingUsers && data.payingUsers.length > 0) return data.payingUsers;
      } catch (e) {}
    }
    return [currentUser];
  });

  // Guardar solo el día modificado
  useEffect(() => {
    // If currentUser exists but is not in the rotationUsers list, 
    // it likely means we switched accounts. Reset to current user.
    if (currentUser && rotationUsers.length > 0 && !rotationUsers.includes(currentUser)) {
      setRotationUsers([currentUser]);
      setPayingUsers([currentUser]);
    }
  }, [currentUser, rotationUsers, setRotationUsers, setPayingUsers]);

  // Save persistence on changes
  useEffect(() => {
    const dataToSave = {
      rotationUsers,
      weight,
      spot,
      payingUsers
    };
    localStorage.setItem('bluntRotationData', JSON.stringify(dataToSave));
  }, [rotationUsers, weight, spot, payingUsers]);

  // Debounced spot search effect
  useEffect(() => {
    const fetchSpots = async () => {
      if (!showSpotDropdown) {
        setSpotSearchResults([]);
        return;
      }
      setIsSearchingSpot(true);
      try {
        const queryVal = spot.trim();
        const baseUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
        const url = new URL(`${baseUrl}/api/spots/search`);
        if (queryVal) {
          url.searchParams.append('query', queryVal);
        }
        
        const res = await fetch(url.toString(), { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setSpotSearchResults(data);
        } else {
          setSpotSearchResults([]);
        }
      } catch(e) {
        console.error("Spot search error", e);
        setSpotSearchResults([]);
      } finally {
        setIsSearchingSpot(false);
      }
    };

    const delay = spot.trim() ? 250 : 0;
    const debounce = setTimeout(fetchSpots, delay);
    return () => clearTimeout(debounce);
  }, [spot, showSpotDropdown]);

  // Debounced user search effect
  useEffect(() => {
    const fetchUsers = async () => {
      if (!showDropdown) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const queryVal = searchQuery.trim();
        const baseUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
        const url = new URL(`${baseUrl}/api/users/search`);
        if (queryVal) {
          url.searchParams.append('query', queryVal);
        }
        
        // Exclude users already in the rotation
        rotationUsers.forEach(user => {
            url.searchParams.append('exclude', user);
        });
        
        const res = await fetch(url, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        } else {
          setSearchResults([]);
        }
      } catch(e) {
        console.error("Search error", e);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Immediate fetch for random suggestions (empty query) or short debounce for typing
    const delay = searchQuery.trim() ? 250 : 0;
    const debounce = setTimeout(fetchUsers, delay);
    return () => clearTimeout(debounce);
  }, [searchQuery, showDropdown]);

  const handleAddUser = async (e, explicitName = null) => {
    if (e) e.preventDefault();
    
    const nameToVerify = explicitName || searchQuery.trim();
    if (!nameToVerify) return;

    if (rotationUsers.includes(nameToVerify)) {
      toast.error(`${nameToVerify} is already in the rotation!`);
      return;
    }

    // 1. Check if the user is in the CURRENT search results (cached)
    let userExists = searchResults.some(u => u.toLowerCase() === nameToVerify.toLowerCase());
    
    // 2. If not in cache and manually typed (Enter/Plus), verify with backend directly
    if (!userExists && !explicitName) {
        setIsSearching(true);
        try {
            const baseUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            const url = new URL(`${baseUrl}/api/users/search`);
            url.searchParams.append('query', nameToVerify);
            
            // Still exclude existing users to be consistent, though handleAddUser already guards
            rotationUsers.forEach(u => url.searchParams.append('exclude', u));
            
            const res = await fetch(url.toString(), {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                // Check if exact match exists in the results from backend
                userExists = data.some(u => u.toLowerCase() === nameToVerify.toLowerCase());
            }
        } catch(e) {
            console.error("Verification error", e);
        } finally {
            setIsSearching(false);
        }
    }
    
    if (!userExists) {
        toast.error("User not found or not registered. Select from the list!");
        return;
    }

    setRotationUsers(prev => [...prev, nameToVerify]);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    toast.success(`${nameToVerify} joined the rotation`);
  };

  const togglePayingUser = (userName) => {
    setPayingUsers(prev => {
      if (prev.includes(userName)) {
        return prev.filter(u => u !== userName);
      } else {
        return [...prev, userName];
      }
    });
  };

  const handleRemoveUser = (userNameToRemove) => {
    if (userNameToRemove === currentUser) return; // Can't remove self
    setRotationUsers(prev => prev.filter(name => name !== userNameToRemove));
    setPayingUsers(prev => prev.filter(name => name !== userNameToRemove));
  };

  const calculateHits = () => {
    return Math.floor(27 / rotationUsers.length);
  };


  const handleIgnite = async () => {
    if (isLoading) return;
    
    setIsLighterActive(true);
    
    // Play sound: Try to play custom file first, fallback to synth oscillator
    try {
      const audio = new Audio('/sounds/spark.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Fallback to oscillator if file doesn't exist or fails
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
      });
    } catch(e) {
      console.warn("Audio playback error", e);
    }

    // Deduplicate spot case
    let finalSpot = spot.trim();
    if (finalSpot) {
      const existingMatch = spotSearchResults.find(s => s.toLowerCase() === finalSpot.toLowerCase());
      if (existingMatch) {
        finalSpot = existingMatch;
      }
    }

    await onAddRotation({
      usernames: rotationUsers,
      spot: finalSpot || undefined,
      weight: weight,
      payingUsers: payingUsers
    });

    setTimeout(() => {
      setIsLighterActive(false);
      toast.success(`Blunt passed! ${calculateHits()} hits each. 💨`);
    }, 1500);
  };

  const renderCircleUsers = () => {
    const total = rotationUsers.length;
    return rotationUsers.map((user, index) => {
      // Calculate position around the circle
      // Primary user is always at the top (idx 0, so angle = -90deg or 270deg)
      const angle = (index * (360 / total)) - 90; 
      const radius = 105; // Reduced from 135 to tighten orbit
      const x = Math.cos(angle * (Math.PI / 180)) * radius;
      const y = Math.sin(angle * (Math.PI / 180)) * radius;

      const isMe = user === currentUser;
      const isPayer = payingUsers.includes(user);

      return (
        <motion.div
          key={user}
          className="absolute"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1, x, y }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          style={{
            originX: 0.5,
            originY: 0.5,
            left: "50%",
            top: "50%",
            marginLeft: "-1.5rem", // Half width
            marginTop: "-1.5rem",  // Half height
          }}
        >
          <div className="relative group">
            <motion.div 
              onClick={() => {
                togglePayingUser(user);
                // Guarantee the X is locked on screen for mobile tap deletion
                setShowDeleteUser(prev => prev === user ? null : user);
              }}
              onHoverStart={() => setShowDeleteUser(user)}
              onHoverEnd={() => setShowDeleteUser(null)}
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-lg backdrop-blur-sm cursor-pointer transition duration-300 transform-gpu
                ${isPayer 
                  ? 'border-green-400 bg-green-900/40 shadow-[0_0_15px_rgba(74,222,128,0.3)] ring-2 ring-green-500/50' 
                  : 'border-white/20 bg-gray-900/60 hover:border-white/40'
                }
              `}>
              <Users className={`w-5 h-5 ${isPayer ? 'text-green-300' : 'text-gray-400'}`} />
              
              {isPayer && (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  className="absolute -top-1 -left-1 bg-[#FFD700] rounded-full p-0.5 shadow-md border border-yellow-200"
                >
                  <Euro className="w-2.5 h-2.5 text-black" />
                </motion.div>
              )}
            </motion.div>
            
            <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md 
                ${isPayer ? 'text-green-400 border border-green-500/30' : 'text-gray-300'}`}>
                {isMe ? 'You' : user}
              </span>
            </div>

            {!isMe && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveUser(user);
                  setShowDeleteUser(null);
                }}
                className={`absolute -top-1 -right-1 bg-red-500 hover:bg-red-400 text-white rounded-full w-[20px] h-[20px] flex items-center justify-center transition-opacity shadow-md z-[60] outline-none touch-manipulation
                  ${showDeleteUser === user ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}
                title="Remove user"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </motion.div>
      );
    });
  };

  return (
    <div className="w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-[24px] md:rounded-3xl p-3 md:p-5 border border-green-500/20 shadow-[0_0_30px_rgba(0,255,65,0.1)] relative overflow-visible">
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Flame className="w-64 h-64 text-green-500 transform rotate-12" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between min-h-[300px]">
        
        {/* Left Side: Controls (Compact) */}
        <div className="w-full md:w-1/3 flex flex-col space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="blunt-title text-2xl md:text-3xl">
                Blunt Rotation
              </h2>
              <p className="text-gray-400 text-[10px] uppercase tracking-wider mt-0.5">Add homies, spark it.</p>
            </div>
          </div>

          <div className="relative z-50">
            <form onSubmit={(e) => handleAddUser(e)} className="relative">
              <input 
                type="text" 
                  onFocus={() => setShowDropdown(true)}
                  onClick={() => setShowDropdown(true)}
                  // Slightly timeout blur so clicks on dropdown results register before blur hides it
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  placeholder="Username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-950/80 border border-gray-700 rounded-lg py-1.5 pl-8 pr-10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors transform-gpu backdrop-blur-sm"
              />
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
              <button type="submit" className="absolute right-1.5 top-1/2 transform -translate-y-1/2 bg-green-600 p-1 rounded text-white hover:bg-green-500 transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
            
            {/* Auto-complete Dropdown */}
            {showDropdown && (searchResults.length > 0 || isSearching) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50 text-xs">
                {isSearching && searchResults.length === 0 ? (
                  <div className="px-3 py-2 text-gray-500 text-[10px] italic flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                    Finding homies...
                  </div>
                ) : (
                  <>
                    {!searchQuery.trim() && (
                      <div className="px-3 py-1 text-[9px] text-gray-500 font-bold border-b border-gray-800">SUGGESTED</div>
                    )}
                    {searchResults.map(user => (
                      <div 
                        key={user}
                        onMouseDown={(e) => e.preventDefault()} // Prevent blur before click on desktop
                        onTouchStart={(e) => e.preventDefault()} // Prevent blur before tap on mobile
                        onClick={() => handleAddUser(null, user)}
                        className="px-3 py-1.5 hover:bg-green-500/10 cursor-pointer flex justify-between items-center transition-colors border-b border-gray-800/50 last:border-0"
                      >
                        <span className="text-white font-medium">{user}</span>
                        <Plus className="w-3 h-3 text-green-500 opacity-50" />
                      </div>
                    ))}
                    {isSearching && searchResults.length > 0 && (
                      <div className="px-3 py-1 text-[8px] text-gray-600 italic animate-pulse border-t border-gray-800/30">Updating...</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="pt-0.5 flex flex-col space-y-3">
            <div className="relative z-40">
              <MapPin className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 z-10" />
              <input 
                type="text" 
                onFocus={() => setShowSpotDropdown(true)}
                onClick={() => setShowSpotDropdown(true)}
                onBlur={() => setTimeout(() => setShowSpotDropdown(false), 200)}
                placeholder="Spot"
                value={spot}
                onChange={(e) => setSpot(e.target.value)}
                className="w-full bg-gray-950/80 border border-gray-700 rounded-lg py-1.5 pl-7 pr-2 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-colors transform-gpu font-medium relative z-10"
              />
              
              {/* Spot Auto-complete Dropdown */}
              {showSpotDropdown && (spotSearchResults.length > 0 || isSearchingSpot) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50 text-[11px]">
                  {isSearchingSpot && spotSearchResults.length === 0 ? (
                    <div className="px-3 py-2 text-gray-500 text-[9px] italic flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                       Loading spots...
                    </div>
                  ) : (
                    <>
                      {!spot.trim() && (
                        <div className="px-3 py-1 text-[8px] text-gray-500 font-bold border-b border-gray-800">FREQUENT SPOTS</div>
                      )}
                      {spotSearchResults.map(s => (
                        <div 
                          key={s}
                          onMouseDown={(e) => e.preventDefault()} 
                          onTouchStart={(e) => e.preventDefault()}
                          onClick={() => {
                              setSpot(s);
                              setShowSpotDropdown(false);
                          }}
                          className="px-3 py-1.5 hover:bg-blue-500/10 cursor-pointer flex justify-between items-center transition-colors border-b border-gray-800/50 last:border-0"
                        >
                          <span className="text-gray-300 font-medium capitalize">{s}</span>
                          <MapPin className="w-3 h-3 text-blue-500 opacity-50" />
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-900/50 p-2.5 rounded-xl border border-gray-800 space-y-1.5">
               <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-gray-500 font-bold">
                 <span>Blunt Weight</span>
                 <span className="text-green-400 text-xs">{weight.toFixed(2)}g</span>
               </div>
               <input 
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-green-500"
               />
               <div className="flex justify-between text-[8px] text-gray-600 px-1 pt-0.5">
                 <span>0.1g</span>
                 <span>0.8g</span>
                 <span>1.5g</span>
               </div>
            </div>

            <div className="flex flex-col space-y-0.5 px-0.5 mt-1">
               <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-[11px]">Total Cost:</span>
                  <span className="text-white font-bold text-sm">{(weight * 5).toFixed(2)}€</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[9px]">Per Payer ({payingUsers.length}):</span>
                  <span className="text-yellow-400 font-bold text-[11px] flex items-center gap-0.5">
                    {payingUsers.length > 0 ? ((weight * 5) / payingUsers.length).toFixed(2) : "0.00"}
                    <Euro className="w-2.5 h-2.5" />
                  </span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side: The Circle UI */}
        <div className="w-full md:w-2/3 h-full min-h-[260px] md:min-h-[300px] relative flex items-center justify-center mt-2 md:mt-0 overflow-visible">
          
          <div className="relative w-full h-full flex items-center justify-center overflow-visible">
             {/* Dynamic dashed circle ring */}
            <div className={`absolute w-[210px] h-[210px] rounded-full border border-dashed transition-colors duration-1000 transform-gpu ${rotationUsers.length > 1 ? 'border-green-500/30' : 'border-gray-700'} `}></div>

            {/* Spark Button in the Center */}
            <motion.div className="z-20 relative px-10">
              <motion.button
                onClick={handleIgnite}
                disabled={isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative group flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 shadow-2xl transition duration-300 transform-gpu ${
                  isLighterActive 
                    ? 'bg-amber-500 border-amber-300 shadow-[0_0_50px_rgba(245,158,11,0.8)]' 
                    : 'bg-green-900 border-green-500 hover:bg-green-800 shadow-[0_0_30px_rgba(0,255,65,0.4)]'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {/* CSS Smoke Particles (simplified) */}
                {isLighterActive && (
                  <div className="absolute -top-20 w-full flex justify-center opacity-70">
                     <motion.div animate={{y: -100, opacity: 0, scale: 2}} transition={{duration: 1.5}} className="absolute w-8 h-8 bg-gray-300 rounded-full blur-xl"></motion.div>
                     <motion.div animate={{y: -80, x: -20, opacity: 0, scale: 2}} transition={{duration: 1.3, delay: 0.1}} className="absolute w-6 h-6 bg-gray-200 rounded-full blur-xl"></motion.div>
                     <motion.div animate={{y: -120, x: 20, opacity: 0, scale: 3}} transition={{duration: 1.8, delay: 0.2}} className="absolute w-10 h-10 bg-gray-400 rounded-full blur-xl"></motion.div>
                  </div>
                )}

                <Flame className={`w-10 h-10 mb-1 ${isLighterActive ? 'text-yellow-100 animate-pulse' : 'text-green-400'}`} />
                <span className={`font-bold uppercase tracking-wider text-[11px] ${isLighterActive ? 'text-amber-900' : 'text-green-300'}`}>
                  {isLighterActive ? 'Sparked!' : 'Add Blunt'}
                </span>
                
              </motion.button>
              
              {/* Hits calculator */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-center">
                 <p className="text-gray-400 text-xs">
                   <span className="text-green-400 font-bold text-base">{calculateHits()}</span> hits / person
                 </p>
              </div>
            </motion.div>

            {/* Render Users Around Center */}
            <AnimatePresence>
              {renderCircleUsers()}
            </AnimatePresence>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default RotationCircle;
