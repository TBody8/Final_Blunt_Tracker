// Mock data for Blunt Tracker app

// Arreglo para que el id sea string (por compatibilidad con backend)
export const bluntDrinks = [
  {
    id: "1",
    name: "Classic Joint",
    caffeine: 0,
    calories: 0,
    sugar: 0,
    size: "Standard",
    image: "/blunt-images/blunt-original.webp", // Will act as placeholder or we change later
    category: "Classic",
    color: "#00ff41",
    defaultPrice: 0
  },
  {
    id: "2",
    name: "Backwoods Blunt",
    caffeine: 0,
    calories: 0,
    sugar: 0,
    size: "Large",
    image: "/blunt-images/blunt-white.webp",
    category: "Tobacco Leaf",
    color: "#8b5a2b",
    defaultPrice: 0
  },
  {
    id: "3",
    name: "Hemp Wrap Blunt",
    caffeine: 0,
    calories: 0,
    sugar: 0,
    size: "Medium",
    image: "/blunt-images/blunt-mangoloco.webp",
    category: "Hemp",
    color: "#228b22",
    defaultPrice: 0
  }
];

export const bluntLevels = [
  { level: 1, name: "Rookie Smoker", minBlunts: 0, maxBlunts: 10, color: "#4ade80", badge: "🌿" },
  { level: 2, name: "Daily Puff", minBlunts: 11, maxBlunts: 50, color: "#22c55e", badge: "💨" },
  { level: 3, name: "Rotation King", minBlunts: 51, maxBlunts: 150, color: "#16a34a", badge: "🔥" },
  { level: 4, name: "Iron Lungs", minBlunts: 151, maxBlunts: 300, color: "#15803d", badge: "😤" },
  { level: 5, name: "Snoop Dogg Status", minBlunts: 301, maxBlunts: 999999, color: "#14532d", badge: "👑" }
];

export const mockQuotes = [
  "Puff, puff, pass.",
  "Roll it up, light it up, smoke it up.",
  "Good weed, good friends, good times.",
  "Respect the rotation.",
  "Never break the circle.",
  "Don't sleep on the blunt.",
  "A friend with weed is a friend indeed.",
  "Stay lifted.",
  "Only good vibes in this rotation.",
  "Pass it to the left.",
  "Smoke weed everyday.",
  "Iron lungs, steady hands.",
  "It's 4:20 somewhere.",
  "Burn slow.",
  "Keep the peace and pass the blunt."
];

export const mockConsumptionData = [
  { date: "2025-01-01", blunts: [{ id: "1", price: 2.99 }, { id: "2", price: 3.29 }], totalBlunts: 300, totalCost: 6.28 },
  { date: "2025-01-02", blunts: [{ id: "1", price: 2.99 }], totalBlunts: 160, totalCost: 2.99 },
  { date: "2025-01-03", blunts: [{ id: "3", price: 3.49 }, { id: "4", price: 3.29 }], totalBlunts: 300, totalCost: 6.78 },
  { date: "2025-01-04", blunts: [{ id: "2", price: 3.29 }, { id: "5", price: 3.49 }], totalBlunts: 300, totalCost: 6.78 },
  { date: "2025-01-05", blunts: [{ id: "1", price: 2.99 }, { id: "1", price: 2.99 }], totalBlunts: 320, totalCost: 5.98 },
  { date: "2025-01-06", blunts: [{ id: "6", price: 3.29 }], totalBlunts: 140, totalCost: 3.29 },
  { date: "2025-01-07", blunts: [{ id: "1", price: 2.99 }, { id: "3", price: 3.49 }, { id: "4", price: 3.29 }], totalBlunts: 460, totalCost: 9.77 },
  { date: "2024-12-15", blunts: [{ id: "1", price: 2.99 }], totalBlunts: 160, totalCost: 2.99 },
  { date: "2024-11-20", blunts: [{ id: "2", price: 3.29 }, { id: "3", price: 3.49 }], totalBlunts: 300, totalCost: 6.78 },
  { date: "2024-10-10", blunts: [{ id: "4", price: 3.29 }], totalBlunts: 140, totalCost: 3.29 }
];

export const getBluntLevel = (totalBlunts, achievementsByLevel = {}) => {
  const safeBlunts = Math.max(0, totalBlunts);
  
  let currentReachedLevel = bluntLevels[0];
  
  for (let i = 0; i < bluntLevels.length; i++) {
    const levelDef = bluntLevels[i];
    
    // Check blunt count requirement
    if (safeBlunts < levelDef.minBlunts) break;
    
    // To BE at level i+1, you must have completed ALL trophies of level i
    if (i > 0) {
      const prevLevelTrophies = achievementsByLevel[i] || []; // Achievements are 1-indexed in results
      const allPrevAchieved = prevLevelTrophies.length > 0 && prevLevelTrophies.every(t => t.achieved);
      if (!allPrevAchieved) break;
    }
    
    currentReachedLevel = levelDef;
  }
  
  return currentReachedLevel;
};

export const getTodayQuote = () => {
  const today = new Date().getDate();
  return mockQuotes[today % mockQuotes.length];
};

// Helper to normalize dates to midnight UTC for reliable comparisons
const normalizeDate = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

export const calculateStreak = (consumptionData) => {
  if (!consumptionData || consumptionData.length === 0) return 0;
  
  // Only consider days with at least one drink
  const daysWithDrinks = consumptionData.filter(d => d.blunts && d.blunts?.length || 0 > 0);
  if (daysWithDrinks.length === 0) return 0;

  const sortedDates = daysWithDrinks
    .map(d => normalizeDate(d.date))
    .sort((a, b) => b - a);
  
  let streak = 0;
  let today = normalizeDate(new Date());
  let lastDate = today;

  // Check if we have consumption today
  const hasConsumptionToday = sortedDates.includes(today);
  
  if (!hasConsumptionToday) {
    // If no consumption today, check yesterday
    const yesterday = today - (1000 * 60 * 60 * 24);
    if (!sortedDates.includes(yesterday)) {
      return 0; // Streak broken
    }
    lastDate = yesterday;
  }

  for (let date of sortedDates) {
    if (date > lastDate) continue; // Skip future dates if any

    const diffTime = lastDate - date;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      if (diffDays === 1 || (diffDays === 0 && streak === 0)) {
        streak++;
        lastDate = date;
      }
    } else {
      break;
    }
  }
  
  return streak;
};

export const calculateBestStreak = (consumptionData) => {
  if (!consumptionData || consumptionData.length === 0) return 0;
  
  const daysWithDrinks = consumptionData.filter(d => d.blunts && d.blunts?.length || 0 > 0);
  if (daysWithDrinks.length === 0) return 0;

  const sortedDates = daysWithDrinks
    .map(d => normalizeDate(d.date))
    .sort((a, b) => a - b);
  
  let bestStreak = 0;
  let currentStreak = 1;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = sortedDates[i - 1];
    const currentDate = sortedDates[i];
    const diffTime = currentDate - prevDate;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak++;
    } else if (diffDays > 1) {
      bestStreak = Math.max(bestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  
  bestStreak = Math.max(bestStreak, currentStreak);
  return bestStreak;
};

// Helper function to ensure positive values for charts
export const sanitizeChartData = (data) => {
  return data.map(value => Math.max(0, value || 0));
};

// Helper function to get data for charts with full time period
export const getChartData = (consumptionData, viewType = 'daily', monthOffset = 0) => {
  const currentDate = new Date();
  
  // Apply month offset accurately (handles going back across years)
  let targetYear = currentDate.getFullYear();
  let targetMonth = currentDate.getMonth() + monthOffset;
  
  // Normalize the month/year if offset pushes it out of the 0-11 bounds
  while (targetMonth < 0) {
    targetMonth += 12;
    targetYear -= 1;
  }
  while (targetMonth > 11) {
    targetMonth -= 12;
    targetYear += 1;
  }
  
  if (viewType === 'daily') {
    // Get all days in target month (1 to 28/30/31)
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const fullMonthData = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = consumptionData.find(d => d.date === dateStr);
      
      fullMonthData.push({
        date: dateStr,
        bluntCount: dayData ? dayData.blunts?.length || 0 : 0,
        caffeine: dayData ? dayData.totalBlunts : 0,
        cost: dayData ? (dayData.blunts || []).reduce((sum, b) => sum + (b.price || 0), 0) : 0,
        label: day.toString()
      });
    }
    
    return fullMonthData;
  } else {
    // Annual view - show all 12 months with totals and daily averages
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const annualData = [];
    
    for (let month = 0; month < 12; month++) {
      const daysInThisMonth = new Date(targetYear, month + 1, 0).getDate();
      
      const monthData = consumptionData.filter(d => {
        const date = new Date(d.date);
        return date.getFullYear() === targetYear && date.getMonth() === month;
      });
      
      const totalBluntsCount = monthData.reduce((sum, d) => sum + (d.blunts?.length || 0), 0);
      const totalBlunts = monthData.reduce((sum, d) => sum + (d.totalBlunts || 0), 0);
      const totalCost = monthData.reduce((sum, d) => sum + (d.blunts || []).reduce((bsum, b) => bsum + (b.price || 0), 0), 0);
      
      // Calculate daily average for this month
      const avgBlunts = (totalBluntsCount / daysInThisMonth).toFixed(2);
      const avgCaffeine = (totalBlunts / daysInThisMonth).toFixed(1);
      
      annualData.push({
        month: month,
        bluntCount: totalBluntsCount,
        caffeine: totalBlunts,
        cost: totalCost,
        avgBlunts: avgBlunts,
        avgCaffeine: avgCaffeine,
        label: monthNames[month]
      });
    }
    
    return annualData;
  }
};

// Helper function to calculate total caffeine consumed overall
export const calculateTotalBlunts = (consumptionData) => {
  return Math.max(0, consumptionData.reduce((sum, day) => sum + (day.totalBlunts || 0), 0));
};

// Helper function to calculate total money spent
export const calculateTotalCost = (consumptionData) => {
  if (!consumptionData) return 0;
  return Math.max(0, consumptionData.reduce((total, day) => {
    const dayCost = (day.blunts || []).reduce((sum, blunt) => sum + (blunt.price || 0), 0);
    return total + dayCost;
  }, 0));
};