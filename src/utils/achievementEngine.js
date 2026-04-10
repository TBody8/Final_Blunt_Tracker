import { TROPHY_LEVELS, OPTIONAL_ACHIEVEMENTS } from '../data/trophyDefinitions';
import { calculateBestStreak } from '../data/mockData';

export const calculateAchievements = (consumptionData, currentUser) => {
  const stats = {
    uniqueSpots: new Set(),
    groupRotations: 0,
    maxParticipants: 0,
    sponsorCount: 0,
    sponsorGroupCount: 0,
    rotationCount: 0,
    weeklyCounts: {}, // ISO week -> count
    buddySessions: {}, // Buddy -> count
    weeklyCounts: {}, // ISO week -> count
    buddySessions: {}, // Buddy -> count
    streak: calculateBestStreak(consumptionData),
    freeloaderCount: 0,
    nightSmokerCount: 0,
    morningSmokerCount: 0,
    totalBluntsCount: 0,
    soloSmokesCount: 0,
    largeRotationCount: 0,
    fattyBluntCount: 0,
    dailyMax: 0,
    totalWeight: 0,
    lateNightCount: 0,
    totalCostStat: 0
  };

  consumptionData.forEach(day => {
    const blunts = day.blunts || [];
    
    if (blunts.length > stats.dailyMax) {
      stats.dailyMax = blunts.length;
    }

    blunts.forEach(blunt => {
      stats.totalBluntsCount++;
      if (blunt.weight) stats.totalWeight += blunt.weight;

      // Freeloader Check: If someone else paid for the rotation
      if (blunt.payer && currentUser && blunt.payer !== currentUser.username) {
        stats.freeloaderCount++;
      }

      // Time of Day Check
      const timeStr = blunt.timestamp || blunt.date;
      if (timeStr) {
        const dStr = timeStr.endsWith('Z') ? timeStr : timeStr + 'Z';
        const h = new Date(dStr).getUTCHours();
        if (h >= 0 && h < 5) stats.nightSmokerCount++;
        if (h >= 2 && h < 5) stats.lateNightCount++;   // El Insomne
        if (h >= 5 && h < 11) stats.morningSmokerCount++;
      }

      // 1. Unique Spots
      if (blunt.spot) stats.uniqueSpots.add(blunt.spot.toLowerCase().trim());

      // 2. Sponsorship
      if (blunt.price > 0) {
        stats.sponsorCount++;
        stats.totalCostStat += blunt.price;             // Donde Fue Mi Dinero
        if (blunt.participants >= 4) stats.sponsorGroupCount++;
      }

      // 4. Group Sessions
      if (blunt.participants >= 3) stats.groupRotations++;
      if (blunt.participants >= 7) stats.largeRotationCount++;
      if (blunt.participants === 1) stats.soloSmokesCount++;
      if (blunt.weight >= 1.5) stats.fattyBluntCount++;
      
      if (blunt.participants > stats.maxParticipants) stats.maxParticipants = blunt.participants;
      if (blunt.participants > 1) stats.rotationCount++;

      // 5. Weekly counts
      const d = new Date(day.date);
      const weekKey = `${d.getFullYear()}-W${getWeekNumber(d)}`;
      stats.weeklyCounts[weekKey] = (stats.weeklyCounts[weekKey] || 0) + 1;
    });
  });

  // Calculate results for all trophies
  const results = {};
  Object.keys(TROPHY_LEVELS).forEach(level => {
    results[level] = TROPHY_LEVELS[level].map(trophy => {
      let progress = 0;
      let achieved = false;

      switch (trophy.type) {
        case 'rotation_count':
          progress = stats.rotationCount;
          break;
        case 'unique_spots':
          progress = stats.uniqueSpots.size;
          break;
        case 'group_rotations':
          progress = stats.groupRotations;
          break;
        case 'streak':
          progress = stats.streak;
          break;
        case 'sponsor_count':
          progress = stats.sponsorCount;
          break;
        case 'max_participants':
          progress = stats.maxParticipants;
          break;
        case 'weekly_count':
          progress = Math.max(...Object.values(stats.weeklyCounts), 0);
          break;
        case 'sponsor_group':
          progress = stats.sponsorGroupCount;
          break;
        case 'weekend_streak':
          progress = checkWeekendStreak(consumptionData);
          break;
        default:
          progress = 0;
      }

      achieved = progress >= trophy.goal;
      return { ...trophy, progress, achieved, percentage: Math.min(100, (progress / trophy.goal) * 100) };
    });
  });

  // Calculate optional achievements
  results.optional = OPTIONAL_ACHIEVEMENTS.map(trophy => {
    let progress = 0;
    switch(trophy.type) {
      case 'freeloader': progress = stats.freeloaderCount; break;
      case 'streak': progress = stats.streak; break;
      case 'night_smoker': progress = stats.nightSmokerCount; break;
      case 'morning_smoker': progress = stats.morningSmokerCount; break;
      case 'sponsor_count': progress = stats.sponsorCount; break;
      case 'total_blunts': progress = stats.totalBluntsCount; break;
      case 'solo_smokes': progress = stats.soloSmokesCount; break;
      case 'large_rotation_count': progress = stats.largeRotationCount; break;
      case 'fatty_blunt': progress = stats.fattyBluntCount; break;
      case 'spot_explorer': progress = stats.uniqueSpots.size; break;
      case 'daily_max': progress = stats.dailyMax; break;
      case 'total_weight': progress = stats.totalWeight; break;
      case 'late_night': progress = stats.lateNightCount; break;
      case 'total_cost': progress = stats.totalCostStat; break;
      case 'sponsor_group': progress = stats.sponsorGroupCount; break;
      default: progress = 0;
    }
    const achieved = progress >= trophy.goal;
    return { ...trophy, progress, achieved, percentage: Math.min(100, (progress / trophy.goal) * 100) };
  });

  return results;
};

// Helper to check if user smoked both Sat and Sun in the same week
const checkWeekendStreak = (consumptionData) => {
  const dates = new Set(consumptionData.map(d => d.date));
  let weekendStreaks = 0;
  
  consumptionData.forEach(day => {
    const d = new Date(day.date);
    if (d.getDay() === 6) { // Saturday
      const sun = new Date(d);
      sun.setDate(d.getDate() + 1);
      const sunStr = sun.toISOString().split('T')[0];
      if (dates.has(sunStr)) weekendStreaks++;
    }
  });
  return weekendStreaks;
};

// Standard ISO week number helper
const getWeekNumber = (d) => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
};
