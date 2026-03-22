import { TROPHY_LEVELS } from '../data/trophyDefinitions';
import { calculateStreak } from '../data/mockData';

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
    streak: calculateStreak(consumptionData)
  };

  consumptionData.forEach(day => {
    const blunts = day.blunts || [];
    blunts.forEach(blunt => {
      // 1. Unique Spots
      if (blunt.spot) stats.uniqueSpots.add(blunt.spot.toLowerCase().trim());

      // 2. Sponsorship
      if (blunt.price > 0) {
        stats.sponsorCount++;
        if (blunt.participants >= 4) stats.sponsorGroupCount++;
      }

      // 4. Group Sessions
      if (blunt.participants >= 3) stats.groupRotations++;
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
