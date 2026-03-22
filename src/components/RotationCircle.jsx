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
        // Don't allow 0 payers if there are users
        if (prev.length === 1 && rotationUsers.length > 0) return prev;
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
    
    // Play sound if available
    try {
      // Create a short oscillator beep to act as 'lighter' sound if no file exists
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(100, audioCtx.currentTime); // Lighter 'flick' type synth
      oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch(e) {
      console.warn("Audio not supported");
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
      const radius = 135; // Reduced from 160 to prevent edge clipping
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
            marginLeft: "-2rem", // Half width
            marginTop: "-2rem",  // Half height
          }}
        >
          <div className="relative group">
            <motion.div 
              onClick={() => togglePayingUser(user)}
              className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-lg backdrop-blur-sm cursor-pointer transition-all
                ${isPayer ? 'bg-green-600/30 border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.4)]' : 'bg-gray-800/80 border-gray-600'}
                ${isMe && !isPayer ? 'border-green-800/50' : ''}
              `}>
              <Users className={`w-6 h-6 ${isPayer ? 'text-green-300' : 'text-gray-400'}`} />
              
              {isPayer && (
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  className="absolute -top-1 -left-1 bg-[#FFD700] rounded-full p-1 shadow-md border border-yellow-200"
                >
                  <Euro className="w-3 h-3 text-black" />
                </motion.div>
              )}
            </motion.div>
            
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-black/60 backdrop-blur-md 
                ${isPayer ? 'text-green-400 border border-green-500/30' : 'text-gray-300'}`}>
                {isMe ? 'You' : user}
              </span>
            </div>

            {!isMe && (
              <button 
                onClick={() => handleRemoveUser(user)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </motion.div>
      );
    });
  };

  return (
    <div className="w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-4 md:p-6 border border-green-500/20 shadow-[0_0_30px_rgba(0,255,65,0.1)] relative overflow-visible">
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Flame className="w-64 h-64 text-green-500 transform rotate-12" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center justify-between min-h-[400px]">
        
        {/* Left Side: Controls (Compact) */}
        <div className="w-full md:w-1/3 flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="blunt-title text-2xl md:text-3xl">
                Blunt Rotation
              </h2>
              <p className="text-gray-400 text-[10px] md:text-xs mt-1">Add homies, spark it.</p>
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
                className="w-full bg-gray-950/80 border border-gray-700 rounded-lg py-2 pl-9 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all backdrop-blur-sm"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <button type="submit" className="absolute right-1.5 top-1/2 transform -translate-y-1/2 bg-green-600 p-1 rounded-md text-white hover:bg-green-500 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </form>
            
            {/* Auto-complete Dropdown */}
            {showDropdown && (searchResults.length > 0 || isSearching) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50 text-sm">
                {isSearching && searchResults.length === 0 ? (
                  <div className="px-3 py-3 text-gray-500 text-xs italic flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                    Finding homies...
                  </div>
                ) : (
                  <>
                    {!searchQuery.trim() && (
                      <div className="px-3 py-1 text-[10px] text-gray-500 font-bold border-b border-gray-800">SUGGESTED</div>
                    )}
                    {searchResults.map(user => (
                      <div 
                        key={user}
                        onMouseDown={(e) => e.preventDefault()} // Prevent blur before click on desktop
                        onTouchStart={(e) => e.preventDefault()} // Prevent blur before tap on mobile
                        onClick={() => handleAddUser(null, user)}
                        className="px-3 py-2 hover:bg-green-500/10 cursor-pointer flex justify-between items-center transition-colors border-b border-gray-800/50 last:border-0"
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

          <div className="pt-2 flex flex-col space-y-4">
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
                className="w-full bg-gray-950/80 border border-gray-700 rounded-lg py-2 pl-8 pr-2 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-green-500/50 transition-all font-medium relative z-10"
              />
              
              {/* Spot Auto-complete Dropdown */}
              {showSpotDropdown && (spotSearchResults.length > 0 || isSearchingSpot) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50 text-xs">
                  {isSearchingSpot && spotSearchResults.length === 0 ? (
                    <div className="px-3 py-2 text-gray-500 text-[10px] italic flex items-center gap-2">
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
                          className="px-3 py-2 hover:bg-blue-500/10 cursor-pointer flex justify-between items-center transition-colors border-b border-gray-800/50 last:border-0"
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

            <div className="bg-gray-900/50 p-3 rounded-xl border border-gray-800 space-y-2">
               <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                 <span>Blunt Weight</span>
                 <span className="text-green-400 text-sm">{weight.toFixed(2)}g</span>
               </div>
               <input 
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-green-500"
               />
               <div className="flex justify-between text-[8px] text-gray-600 px-1">
                 <span>0.1g</span>
                 <span>0.8g</span>
                 <span>1.5g</span>
               </div>
            </div>

            <div className="flex flex-col space-y-1 px-1">
               <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Total Cost:</span>
                  <span className="text-white font-bold text-base">{(weight * 5).toFixed(2)}€</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[10px]">Per Payer ({payingUsers.length}):</span>
                  <span className="text-yellow-400 font-bold text-xs flex items-center gap-1">
                    {payingUsers.length > 0 ? ((weight * 5) / payingUsers.length).toFixed(2) : "0.00"}
                    <Euro className="w-2 h-2" />
                  </span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side: The Circle UI */}
        <div className="w-full md:w-2/3 h-full min-h-[380px] relative flex items-center justify-center mt-2 md:mt-0 overflow-visible">
          
          <div className="relative w-full h-full flex items-center justify-center overflow-visible">
             {/* Dynamic dashed circle ring */}
            <div className={`absolute w-[270px] h-[270px] rounded-full border border-dashed transition-all duration-1000 ${rotationUsers.length > 1 ? 'border-green-500/30' : 'border-gray-700'} `}></div>

            {/* Spark Button in the Center */}
            <motion.div className="z-20 relative px-10">
              <motion.button
                onClick={handleIgnite}
                disabled={isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative group flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 shadow-2xl transition-all duration-300 ${
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
