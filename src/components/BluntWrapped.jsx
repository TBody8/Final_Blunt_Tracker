import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wine, X, Zap, Target, Flame, Euro, Coffee, Award, Calendar, Sunrise, Sun, Moon, Activity, TrendingDown, CreditCard, BarChart, MonitorPlay } from 'lucide-react';
import * as mockData from '../data/mockData';

export default function BluntWrapped({ consumptionData, onClose }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // -------------------------------------------------------------
  // Data Computation Engine
  // -------------------------------------------------------------
  const stats = useMemo(() => {
    const now = new Date();
    
    // Identify the target month robustly:
    // If we're on the 1st, 2nd, or 3rd of a new month, we assume this is the Wrapped for the *previous* month.
    // Otherwise, we take the current month.
    let targetMonth = now.getMonth() + 1;
    let targetYear = now.getFullYear();
    
    if (now.getDate() <= 3) {
      targetMonth -= 1;
      if (targetMonth === 0) {
        targetMonth = 12;
        targetYear -= 1;
      }
    }
    
    const targetMonthPrefix = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    const targetMonthName = new Date(targetYear, targetMonth - 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    
    // Filter data strictly to the target month
    const thisMonthData = consumptionData.filter(d => d.date.startsWith(targetMonthPrefix));
    
    let totalBlunts = 0;
    let totalSpend = 0;
    let mapIdToCount = {};
    let spotCounts = {};

    thisMonthData.forEach(day => {
      totalBlunts += day.blunts.length;
      totalSpend += 0;
      
      day.blunts.forEach(blunt => {
        mapIdToCount[blunt.id] = (mapIdToCount[blunt.id] || 0) + 1;
        if (blunt.spot) {
           spotCounts[blunt.spot] = (spotCounts[blunt.spot] || 0) + 1;
        }
      });
    });

    // Find the favorite and the rarest
    let topBluntId = null;
    let topBluntCount = 0;
    
    let bottomBluntId = null;
    let bottomBluntCount = Infinity;

    Object.keys(mapIdToCount).forEach(id => {
      if (mapIdToCount[id] > topBluntCount) {
        topBluntCount = mapIdToCount[id];
        topBluntId = id;
      }
      if (mapIdToCount[id] > 0 && mapIdToCount[id] < bottomBluntCount) {
        bottomBluntCount = mapIdToCount[id];
        bottomBluntId = id;
      }
    });

    let favoriteSpot = "No smoking spots recorded";
    let favoriteSpotCount = 0;
    Object.keys(spotCounts).forEach(spot => {
      if (spotCounts[spot] > favoriteSpotCount) {
        favoriteSpotCount = spotCounts[spot];
        favoriteSpot = spot;
      }
    });

    // Most active day of week
    const dayOfWeekNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let daysCount = [0,0,0,0,0,0,0];
    thisMonthData.forEach(day => {
      const gDate = new Date(day.date);
      daysCount[gDate.getDay()] += day.blunts.length;
    });
    const favoriteDayCount = Math.max(...daysCount);
    const favoriteDay = dayOfWeekNames[daysCount.indexOf(favoriteDayCount)];

    const topBluntObj = topBluntId ? mockData.bluntDrinks.find(d => String(d.id) === String(topBluntId)) : null;
    let topBluntName = topBluntObj ? topBluntObj.name : "None";
    let topBluntImage = topBluntObj ? topBluntObj.image : "";

    const bottomBluntObj = bottomBluntId ? mockData.bluntDrinks.find(d => String(d.id) === String(bottomBluntId)) : null;
    let bottomBluntName = bottomBluntObj ? bottomBluntObj.name : "None";
    let bottomBluntImage = bottomBluntObj ? bottomBluntObj.image : "";

    // ----------------------------------------------------
    // New Gamified Stats: Extended Analytics
    // ----------------------------------------------------
    const uniqueFlavors = Object.keys(mapIdToCount).length;
    const espressoEquivalent = Math.round(totalBlunts / 64); // Avg shot of espresso is ~64mg
    
    // 1. Sugar Free vs Regular Ratio
    let sugarFreeCount = 0;
    let totalCalories = 0;
    
    // 2. Time of Day Persona (Morning: 5-12, Afternoon: 12-18, Night: 18-5)
    let timeZones = { morning: 0, afternoon: 0, night: 0 };

    thisMonthData.forEach(day => {
      day.blunts.forEach(blunt => {
        const bluntRef = mockData.bluntDrinks.find(d => String(d.id) === String(blunt.id));
        if (bluntRef) {
          if (bluntRef.zeroSugar) sugarFreeCount++;
          totalCalories += (bluntRef.calories || 0);
        }

        // Time analysis based on timestamp
        const hr = new Date(blunt.timestamp).getHours();
        if (hr >= 5 && hr < 12) timeZones.morning++;
        else if (hr >= 12 && hr < 18) timeZones.afternoon++;
        else timeZones.night++;
      });
    });

    const sugarFreePercentage = totalBlunts > 0 ? Math.round((sugarFreeCount / totalBlunts) * 100) : 0;
    
    // Determine Time Persona
    let timePersona = "The Daywalker"; // Default afternoon
    let timePersonaIcon = "Sun";
    if (timeZones.night > timeZones.morning && timeZones.night > timeZones.afternoon) {
      timePersona = "The Night Owl";
      timePersonaIcon = "Moon";
    } else if (timeZones.morning > timeZones.afternoon && timeZones.morning > timeZones.night) {
      timePersona = "The Early Riser";
      timePersonaIcon = "Sunrise";
    }

    // Calories to km running equivalent (Average 70kg person running burns ~70 calories per km)
    const runningKmEquivalent = Math.round(totalCalories / 70);

    // ----------------------------------------------------
    // Even MORE Gamified Stats (The 15 Story Expansion)
    // ----------------------------------------------------

    // 3. The Wallet Bleed (Netflix Subs)
    const validSpend = thisMonthData.reduce((sum, day) => {
      const dayTotal = day.blunts ? day.blunts.reduce((acc, blunt) => acc + (0), 0) : 0;
      return sum + dayTotal;
    }, 0);
    const validDrinks = thisMonthData.reduce((sum, day) => sum + (day.blunts?.length || 0), 0);
    const netflixSubsEquivalent = (validSpend / 12.99).toFixed(1);

    // 4. Average Price
    const averagePrice = validDrinks > 0 ? (validSpend / validDrinks).toFixed(2) : "0.00";

    // 5. The Binge Scale & Busiest Day
    let maxCansInOneDay = 0;
    let busiestDayDate = "None";
    
    // Calculate longest consecutive streak this month & Busiest Day
    const days = thisMonthData.map(d => new Date(d.date)).sort((a,b) => a - b);
    let currentStreak = 0;
    let maxStreak = 0;
    for (let i = 0; i < days.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const diffTime = Math.abs(days[i] - days[i-1]);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      }
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    }

    thisMonthData.forEach(day => {
       if (day.blunts.length >= maxCansInOneDay) {
         maxCansInOneDay = day.blunts.length;
         const [year, month, d] = day.date.split('-');
         busiestDayDate = `${parseInt(d, 10)} DE ${new Date(year, month - 1).toLocaleString('es-ES', { month: 'long' }).toUpperCase()}`;
       }
    });

    if (busiestDayDate === "None" && thisMonthData.length > 0) {
      maxCansInOneDay = thisMonthData[0].blunts.length;
      const [year, month, d] = thisMonthData[0].date.split('-');
      busiestDayDate = `${parseInt(d, 10)} DE ${new Date(year, month - 1).toLocaleString('es-ES', { month: 'long' }).toUpperCase()}`;
    }

    return { 
      totalBlunts, 
      totalSpend, 
      totalBlunts, 
      topBluntName, 
      topBluntImage, 
      topBluntCount,
      bottomBluntName,
      bottomBluntImage,
      bottomBluntCount,
      uniqueFlavors,
      espressoEquivalent,
      maxStreak,
      favoriteDay,
      favoriteDayCount,
      sugarFreePercentage,
      totalCalories,
      runningKmEquivalent,
      timePersona,
      timePersonaIcon,
      netflixSubsEquivalent,
      averagePrice,
      busiestDayDate,
      targetMonthName,
      favoriteSpot,
      favoriteSpotCount
    };
  }, [consumptionData]);

  // -------------------------------------------------------------
  // Dynamic Slides Configuration
  // -------------------------------------------------------------
  const slides = useMemo(() => {
    const arr = [];

    // Slide 1: Intro
    arr.push(
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.8 }} className="mb-8">
          <Flame className="w-24 h-24 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
        </motion.div>
        <motion.h1 initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-7xl md:text-8xl text-white blunt-title mb-4">
          Unleash the Beast.
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-xl text-yellow-200/80">
          Your Monthly Smoke Report is here.
        </motion.p>
      </div>
    );

    // Slide 2: The Volume
    arr.push(
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring" }} className="mb-6 bg-gradient-to-br from-green-500 to-emerald-700 p-6 rounded-3xl shadow-2xl shadow-green-500/20">
          <Wine className="w-16 h-16 text-black" />
        </motion.div>
        <motion.h2 initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }} className="text-6xl text-white mb-4 blunt-title">
          Fuel Consumed
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-7xl font-black text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)] tracking-tighter mb-4">
          {stats.totalBlunts}
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-gray-400 text-lg">
          Blunts smoked.
        </motion.p>
      </div>
    );

    // Slide 3: Caffeine Equivalency
    arr.push(
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring" }} className="mb-6">
          <Coffee className="w-20 h-20 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
        </motion.div>
        <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-6xl text-white mb-4 blunt-title">
          The Voltage
        </motion.h2>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-gray-900 border border-yellow-500/30 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-xl shadow-yellow-500/10">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-lg">Total Caffeine</span>
            <span className="text-3xl font-bold text-yellow-400">{stats.totalBlunts}mg</span>
          </div>
          <div className="h-px bg-yellow-500/20"></div>
          <p className="text-white text-lg">
            That's roughly equivalent to taking <span className="text-yellow-400 font-bold text-3xl">{stats.espressoEquivalent}</span> mega hits!
          </p>
        </motion.div>
      </div>
    );

    // Slide 4: Persona
    const isExplorer = stats.uniqueFlavors >= 4;
    arr.push(
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="mb-6">
          <Award className={`w-24 h-24 ${isExplorer ? 'text-purple-400 drop-shadow-[0_0_20px_rgba(192,132,252,0.8)]' : 'text-blue-400 drop-shadow-[0_0_20px_rgba(96,165,250,0.8)]'}`} />
        </motion.div>
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-lg text-gray-400 mb-2 tracking-widest">
          Your Energy Persona
        </motion.h2>
        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className={`text-7xl md:text-8xl mb-6 blunt-title ${isExplorer ? 'text-purple-400' : 'text-blue-400'}`}>
          {isExplorer ? "The Explorer" : "The Loyalist"}
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-xl text-gray-300 max-w-sm">
          {isExplorer 
            ? `You tasted ${stats.uniqueFlavors} different flavors this month. Always hunting for the next rush.` 
            : `You stuck to ${stats.uniqueFlavors} core flavor${stats.uniqueFlavors !== 1 ? 's' : ''}. Why change perfection?`}
        </motion.p>
      </div>
    );

    // Slide 5: Sugar Free vs Regular (The Purity Check)
    arr.push(
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="mb-6">
          <Wine className={`w-24 h-24 ${stats.sugarFreePercentage > 50 ? 'text-blue-400 drop-shadow-[0_0_20px_rgba(96,165,250,0.8)]' : 'text-green-500 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]'}`} />
        </motion.div>
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-lg text-gray-400 mb-2 tracking-widest">
          The Health Balance
        </motion.h2>
        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className={`text-6xl mb-4 blunt-title ${stats.sugarFreePercentage > 50 ? 'text-blue-400' : 'text-green-500'}`}>
          {stats.sugarFreePercentage}%
        </motion.h1>
        <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-xl text-white mb-6">
          Premium Quality
        </motion.h3>
        <div className="w-full max-w-xs h-4 bg-gray-800 rounded-full overflow-hidden flex mb-6 shadow-inner">
          <motion.div initial={{ width: "0%" }} animate={{ width: `${100 - stats.sugarFreePercentage}%` }} transition={{ delay: 1, duration: 1 }} className="h-full bg-green-500" />
          <motion.div initial={{ width: "0%" }} animate={{ width: `${stats.sugarFreePercentage}%` }} transition={{ delay: 1, duration: 1 }} className="h-full bg-blue-500" />
        </div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="text-lg text-gray-300 max-w-sm">
          {stats.sugarFreePercentage > 80 ? "Smoking that top shelf exclusively." : 
           stats.sugarFreePercentage > 40 ? "Walking the line between the good stuff and the regular pack." : 
           "You embrace the mid pack. A true survivor."}
        </motion.p>
      </div>
    );

    // Slide 6: Time of Day Persona
    arr.push(
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring" }} className="mb-6">
          {stats.timePersonaIcon === "Moon" ? <Moon className="w-24 h-24 text-indigo-400 drop-shadow-[0_0_20px_rgba(129,140,248,0.6)]" /> :
           stats.timePersonaIcon === "Sunrise" ? <Sunrise className="w-24 h-24 text-orange-400 drop-shadow-[0_0_20px_rgba(251,146,60,0.6)]" /> :
           <Sun className="w-24 h-24 text-yellow-500 drop-shadow-[0_0_20px_rgba(234,179,8,0.6)]" />}
        </motion.div>
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-lg text-gray-400 mb-2 tracking-widest">
          Chronotype
        </motion.h2>
        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className={`text-7xl mb-6 blunt-title ${stats.timePersonaIcon === 'Moon' ? 'text-indigo-400' : stats.timePersonaIcon === 'Sunrise' ? 'text-orange-400' : 'text-yellow-500'}`}>
          {stats.timePersona}
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-lg text-gray-300 max-w-sm">
          {stats.timePersona === "The Night Owl" ? "While the world sleeps, your mind is soaring. Most of your smoke is consumed after dark." :
           stats.timePersona === "The Early Riser" ? "You kickstart the day with a wake and bake. Most of your hits are before noon." :
           "You power through the midday slump. Afternoon sessions are your specialty."}
        </motion.p>
      </div>
    );

    // Slide 7: The Energy Debt (Calories)
    if (stats.totalCalories > 0) {
      arr.push(
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <motion.div initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring" }} className="mb-6 bg-orange-500/20 p-6 rounded-full border border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.4)]">
            <Flame className="w-16 h-16 text-orange-500" />
          </motion.div>
          <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-6xl text-white mb-4 blunt-title">
            The Energy Debt
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-xl text-gray-300 mb-6">
            You absorbed <span className="text-orange-500 font-bold text-3xl mx-2">{stats.totalCalories}</span> kcal this month.
          </motion.p>
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <p className="text-gray-400">To burn that off, you'd need to run approximately:</p>
            <p className="text-3xl text-white mt-4">{stats.runningKmEquivalent} <span className="text-xl text-gray-500">km</span></p>
          </motion.div>
        </div>
      );
    }



    // Slide 8: The Streak
    if (stats.maxStreak > 1) {
      arr.push(
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring" }} className="mb-6">
            <Calendar className="w-20 h-20 text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
          </motion.div>
          <motion.h2 initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }} className="text-6xl text-white mb-4 blunt-title">
            The Marathon
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-2xl text-gray-300">
            For <span className="text-red-500 font-black text-5xl mx-2">{stats.maxStreak}</span> consecutive days, you didn't miss a beat.
          </motion.p>
        </div>
      );
    }

    // Slide 8b: Favorite Spot
    if (stats.favoriteSpotCount > 0 && stats.favoriteSpot !== "No smoking spots recorded") {
      arr.push(
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <motion.div initial={{ scale: 0 }} animate={{ rotate: 360, scale: 1 }} transition={{ type: "spring", duration: 1 }} className="mb-6 bg-gray-900 border border-emerald-500/50 p-6 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)]">
            <Target className="w-16 h-16 text-emerald-400" />
          </motion.div>
          <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-lg text-gray-400 mb-2 tracking-widest">
            The Sanctuary
          </motion.h2>
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="text-6xl mb-6 blunt-title text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            {stats.favoriteSpot}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-lg text-gray-300 max-w-sm">
            You sparked up here {stats.favoriteSpotCount} times this month. Your true smoking sanctuary.
          </motion.p>
        </div>
      );
    }

    // Slide 6: Top Flavor
    if (stats.topBluntName !== "None") {
      arr.push(
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-5xl md:text-6xl text-green-400 mb-8 blunt-title">
            Your Trusted Weapon
          </motion.h2>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="relative mb-6">
            <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full"></div>
            <img src={stats.topBluntImage} alt="Top Drink" className="relative w-48 h-auto max-h-[40vh] object-contain drop-shadow-2xl z-10" />
          </motion.div>
          <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-2xl text-white mb-2">
            {stats.topBluntName}
          </motion.h3>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-xl text-gray-400">
            You called upon this smoke {stats.topBluntCount} times.
          </motion.p>
        </div>
      );
    }

    // Slide 7: Favorite Day of Week
    if (stats.favoriteDayCount > 0) {
      arr.push(
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <motion.div initial={{ scale: 0 }} animate={{ rotate: 360, scale: 1 }} transition={{ type: "spring", duration: 1 }} className="mb-6 bg-gray-900 border border-indigo-500/50 p-6 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.4)]">
            <Target className="w-16 h-16 text-indigo-400" />
          </motion.div>
          <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-lg text-gray-400 mb-2 tracking-widest">
            Peak Focus
          </motion.h2>
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="text-7xl mb-6 blunt-title text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            {stats.favoriteDay}s
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-lg text-gray-300 max-w-sm">
            You smoked {stats.favoriteDayCount} blunts on {stats.favoriteDay}s this month. Clearly, that's your heaviest day.
          </motion.p>
        </div>
      );
    }

    // Slide 10: Rarest Drink (The Shiny)
    if (stats.bottomBluntName !== "None" && stats.uniqueFlavors > 1) {
      arr.push(
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl md:text-5xl text-fuchsia-400 mb-8 blunt-title tracking-widest">
            The Rarest Spawn
          </motion.h2>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="relative mb-6">
            <div className="absolute inset-0 bg-fuchsia-500/20 blur-3xl rounded-full"></div>
            <img src={stats.bottomBluntImage} alt="Rarest Drink" className="relative w-40 h-auto max-h-[35vh] object-contain drop-shadow-2xl z-10 opacity-80 mix-blend-luminosity grayscale hover:grayscale-0 transition-all duration-700" />
          </motion.div>
          <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-2xl text-white mb-2">
            {stats.bottomBluntName}
          </motion.h3>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-lg text-gray-400 max-w-sm">
            You only smoked this {stats.bottomBluntCount} time{stats.bottomBluntCount > 1 ? 's' : ''}. The elusive shiny reserve.
          </motion.p>
        </div>
      );
    }

    // Slide 11: The Busiest Day
    arr.push(
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring" }} className="mb-6 bg-red-500/10 p-6 rounded-full border border-red-500/30">
          <Activity className="w-16 h-16 text-red-500" />
        </motion.div>
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-lg text-gray-400 mb-2 tracking-widest">
          The Busiest Day
        </motion.h2>
        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="text-6xl md:text-7xl mb-6 blunt-title text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] leading-tight tracking-normal">
          {stats.busiestDayDate !== "None" ? stats.busiestDayDate : "Unknown"}
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-lg text-gray-300 max-w-sm">
          Whatever happened that day... you survived it. That's what matters.
        </motion.p>
      </div>
    );

    // Slide 12: The Binge Scale
    if (stats.maxCansInOneDay > 1) {
      arr.push(
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <motion.div initial={{ scale: 0, rotate: 180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", duration: 1 }} className="mb-6">
            <TrendingDown className={`w-24 h-24 ${stats.maxCansInOneDay >= 4 ? 'text-red-500' : 'text-orange-400'}`} />
          </motion.div>
          <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-lg text-gray-400 mb-2 tracking-widest">
            The Overclocking Peak
          </motion.h2>
          <motion.h1 initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: "spring", bounce: 0.8 }} className="text-7xl mb-6 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
            {stats.maxCansInOneDay}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-xl text-gray-300 max-w-sm">
            Most blunts consumed in a single 24-hour window. {stats.maxCansInOneDay >= 3 ? "Your lungs must have been screaming." : "A solid double session."}
          </motion.p>
        </div>
      );
    }

    // Slide 13: Average Price Paid
    arr.push(
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring" }} className="mb-6 bg-green-500/10 p-6 rounded-full border border-green-500/30">
          <Euro className="w-16 h-16 text-green-400" />
        </motion.div>
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-lg text-gray-400 mb-2 tracking-widest">
          The Average Sip
        </motion.h2>
        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="text-8xl mb-6 blunt-title text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]">
          {!isNaN(stats.averagePrice) ? `${stats.averagePrice}€` : "0.00€"}
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-lg text-gray-300 max-w-sm">
          {parseFloat(stats.averagePrice) < 1.60 ? "Master Negotiator. You hunt for deals." : parseFloat(stats.averagePrice) > 1.90 ? "You pay the premium tax daily. Time is money." : "A standard going rate for premium gas."}
        </motion.p>
      </div>
    );

    // Slide 14: The Wallet Bleed
    if (stats.netflixSubsEquivalent > 0) {
      arr.push(
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
          <motion.div initial={{ rotate: 90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring" }} className="mb-6">
            <MonitorPlay className="w-20 h-20 text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.6)]" />
          </motion.div>
          <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-6xl text-white mb-4 blunt-title">
            The Wallet Bleed
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-xl text-gray-300 mb-6">
            With the {stats.totalSpend.toFixed(2)}€ you spent on smoking...
          </motion.p>
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <p className="text-gray-400">You could have bought:</p>
            <p className="text-3xl text-red-500 mt-4">{stats.netflixSubsEquivalent} <span className="text-xl text-gray-500">months</span></p>
            <p className="text-gray-400 mt-2">of Netflix Premium.</p>
          </motion.div>
        </div>
      );
    }

    // Slide 15: Recap Screen
    const isExplorerFinal = stats.uniqueFlavors >= 4;
    const getShortName = (name) => name ? name.replace(/Blunt Energy /gi, "").trim() : "";

    arr.push(
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <h2 className="text-6xl text-white mb-8 blunt-title">Monthly Recap</h2>
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 border border-yellow-500/50 shadow-[0_0_50px_rgba(250,204,21,0.2)] w-full max-w-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/10 blur-3xl rounded-full"></div>
          
          <div className="flex items-center gap-4 mb-8 relative z-10">
            <Flame className="w-8 h-8 text-yellow-400" />
            <h3 className="text-xl text-white tracking-widest">{stats.targetMonthName}</h3>
          </div>

          <div className="space-y-6 text-left relative z-10">
            <div>
              <p className="text-xs text-gray-500 tracking-widest uppercase mb-1">Top Session</p>
              <p className="text-2xl font-bold text-green-400 overflow-hidden text-ellipsis whitespace-nowrap">{getShortName(stats.topBluntName)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-bold text-gray-500 tracking-widest uppercase mb-1">Blunts</p>
                <p className="text-2xl font-bold text-white">{stats.totalBlunts}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 tracking-widest uppercase mb-1">Top Spot</p>
                <p className="text-xl font-bold text-white overflow-hidden text-ellipsis whitespace-nowrap">{stats.favoriteSpot}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 tracking-widest uppercase mb-1">Persona</p>
              <p className={`text-2xl font-bold ${isExplorerFinal ? 'text-purple-400' : 'text-blue-400'}`}>
                {isExplorerFinal ? "The Explorer" : "The Loyalist"}
              </p>
            </div>
          </div>
        </div>
        
        <motion.button
          onClick={onClose}
          className="mt-12 bg-white text-black px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-200 transition-colors pointer-events-auto shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Close Wrapped
        </motion.button>
      </div>
    );

    return arr;
  }, [stats, onClose]);

  // -------------------------------------------------------------
  // Precise Animation Frame Timer Logic (Supports Pausing)
  // -------------------------------------------------------------
  const latestIndex = useRef(currentSlideIndex);
  latestIndex.current = currentSlideIndex;

  useEffect(() => {
    let animationFrameId;
    let lastTime = performance.now();
    let accumulated = progress; 

    const tick = (currentTime) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;

      const totalSlides = slides.length;
      const isLastSlide = latestIndex.current === totalSlides - 1;

      if (!isPaused) {
        if (!isLastSlide || accumulated < 100) {
          accumulated += (delta / 6000) * 100; // 6 seconds to reach 100%
          
          if (accumulated >= 100) {
            if (!isLastSlide) {
              setCurrentSlideIndex(prev => prev + 1);
              setProgress(0);
              accumulated = 0;
            } else {
              // Stay at 100% on the final slide
              setProgress(100);
              accumulated = 100;
            }
          } else {
            setProgress(accumulated);
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
    // deliberately omitting 'progress' so rAF loop drives it seamlessly
  }, [isPaused, slides.length]); 

  // Manual Navigation Overrides
  const jumpNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
      setProgress(0);
    }
  };

  const jumpPrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
      setProgress(0);
    } else {
      setProgress(0); 
    }
  };

  const pointerDownTime = useRef(0);

  const handlePointerDown = () => {
    pointerDownTime.current = Date.now();
    setIsPaused(true);
  };
  
  const handlePointerUp = (action) => {
    setIsPaused(false);
    const duration = Date.now() - pointerDownTime.current;
    if (duration < 300 && action) { // If hold duration is less than 300ms, it's a tap
      action();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex bg-black overflow-hidden select-none touch-none">
      {/* Interaction Zones (Handles both clicking to advance and holding to pause) using pure Pointer Events */}
      <div 
        className="absolute inset-y-0 left-0 w-[40%] z-10 cursor-pointer" 
        onPointerDown={handlePointerDown}
        onPointerUp={() => handlePointerUp(jumpPrevSlide)}
        onPointerLeave={() => setIsPaused(false)}
        onPointerCancel={() => setIsPaused(false)}
      />
      <div 
        className="absolute inset-y-0 right-0 w-[60%] z-10 cursor-pointer" 
        onPointerDown={handlePointerDown}
        onPointerUp={() => handlePointerUp(jumpNextSlide)}
        onPointerLeave={() => setIsPaused(false)}
        onPointerCancel={() => setIsPaused(false)}
      />

      {/* Top Progress Bar */}
      <div className="absolute top-0 left-0 w-full p-6 flex gap-2 z-20 pointer-events-none">
        {slides.map((_, idx) => {
          let barWidth = "0%";
          if (idx < currentSlideIndex) barWidth = "100%";
          else if (idx === currentSlideIndex) barWidth = `${progress}%`;

          return (
            <div key={idx} className="h-1.5 flex-1 bg-gray-800 rounded-full overflow-hidden shadow-sm">
              <div 
                className="h-full bg-white shadow-[0_0_10px_white] transition-none"
                style={{ width: barWidth }}
              />
            </div>
          );
        })}
      </div>

      {/* Close button */}
      <button onClick={onClose} className="absolute top-10 right-8 z-30 p-2 text-white/50 hover:text-white bg-black/50 rounded-full backdrop-blur-md pointer-events-auto transition-colors">
        <X className="w-8 h-8" />
      </button>

      {/* Slide Content */}
      <div className="relative w-full h-full flex flex-col justify-center max-w-md mx-auto z-0 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlideIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full flex flex-col justify-center"
          >
            {slides[currentSlideIndex]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
