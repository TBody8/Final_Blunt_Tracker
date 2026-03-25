// AI-powered insights and recommendations

import { apiCache, computationCache } from './performance';

// AI Pattern Recognition Engine
class AIInsightsEngine {
  constructor() {
    this.patterns = new Map();
    this.insights = [];
  }

  // Analyze consumption patterns
  analyzeConsumptionPatterns(consumptionData) {
    const cacheKey = `patterns_${JSON.stringify(consumptionData)}`;
    const cached = computationCache.get(cacheKey);
    if (cached) return cached;

    const patterns = {
      weeklyTrends: this.analyzeWeeklyTrends(consumptionData),
      timePreferences: this.analyzeTimePreferences(consumptionData),
      bluntTolerancePattern: this.analyzeBluntTolerancePattern(consumptionData),
      streakPrediction: this.predictStreakContinuation(consumptionData)
    };

    computationCache.set(cacheKey, patterns);
    return patterns;
  }

  analyzeWeeklyTrends(data) {
    const weekdayData = Array(7).fill(0).map(() => ({ total: 0, count: 0 }));
    
    data.forEach(day => {
      const date = new Date(day.date);
      const weekday = date.getDay();
      weekdayData[weekday].total += (day.blunts || []).length;
      weekdayData[weekday].count += 1;
    });

    return weekdayData.map((day, index) => {
      // Change order: start with Monday, end with Sunday
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dayIndex = (index + 6) % 7; // 0=Sunday -> 6, 1=Monday -> 0, ...
      return {
        day: days[dayIndex],
        average: day.count > 0 ? (day.total / day.count).toFixed(1) : 0,
        trend: this.calculateTrend(day.total, day.count)
      };
    });
  }

  analyzeTimePreferences(data) {
    const timeSlots = {
      morning: { count: 0, percentage: 0 },   // 5:00 - 11:59
      afternoon: { count: 0, percentage: 0 }, // 12:00 - 17:59
      evening: { count: 0, percentage: 0 }   // 18:00 - 4:59
    };

    let totalDrinksWithTime = 0;
    
    data.forEach(day => {
      (day.blunts || []).forEach(drink => {
        if (drink.timestamp) {
          totalDrinksWithTime++;
          const hour = new Date(drink.timestamp).getHours();
          
          if (hour >= 5 && hour < 12) {
            timeSlots.morning.count++;
          } else if (hour >= 12 && hour < 18) {
            timeSlots.afternoon.count++;
          } else {
            timeSlots.evening.count++;
          }
        }
      });
    });

    if (totalDrinksWithTime > 0) {
      timeSlots.morning.percentage = ((timeSlots.morning.count / totalDrinksWithTime) * 100).toFixed(1);
      timeSlots.afternoon.percentage = ((timeSlots.afternoon.count / totalDrinksWithTime) * 100).toFixed(1);
      timeSlots.evening.percentage = ((timeSlots.evening.count / totalDrinksWithTime) * 100).toFixed(1);
    } else {
      // Fallback to basic distribution if no timestamps exist yet
      const totalDrinks = data.reduce((sum, day) => sum + (day.blunts || []).length, 0);
      if (totalDrinks > 0) {
        timeSlots.morning.percentage = "40.0";
        timeSlots.afternoon.percentage = "40.0";
        timeSlots.evening.percentage = "20.0";
      }
    }

    return timeSlots;
  }

  analyzeBluntTolerancePattern(data) {
    const totalBlunts = data.reduce((sum, day) => sum + (day.blunts || []).length, 0);
    
    // Calculate weeks since the very first session for true historical average
    let totalWeeks = 1;
    if (data.length > 0) {
      const dates = data.map(d => new Date(d.date)).sort((a,b) => a-b);
      const firstDate = dates[0];
      const today = new Date();
      const diffDays = Math.ceil((today - firstDate) / (1000 * 60 * 60 * 24));
      totalWeeks = Math.max(1, diffDays / 7);
    }

    const averageWeekly = totalBlunts / totalWeeks;

    let toleranceLevel = 'Low';
    let recommendation = 'Maintain current vibes';

    // Adjusted thresholds for Weekly Consumption
    if (averageWeekly > 35) {
      toleranceLevel = 'OG Smoker';
      recommendation = 'Major weekly tolerance detected. Consider a T-Break to reset your levels.';
    } else if (averageWeekly > 14) {
      toleranceLevel = 'Regular';
      recommendation = 'Chilled pace, but watch your weekly productivity!';
    } else if (averageWeekly > 0) {
      toleranceLevel = 'Social';
      recommendation = 'Perfect weekly balance. Keep it light!';
    }

    return {
      level: toleranceLevel,
      averageWeekly: averageWeekly.toFixed(1),
      recommendation,
      riskLevel: this.calculateRiskLevel(averageWeekly / 7) 
    };
  }

  predictStreakContinuation(data) {
    const recentDays = data.slice(-14); // Analyze last 2 weeks
    const activeDays = recentDays.filter(day => (day.blunts || []).length > 0).length;
    const consistency = activeDays / (recentDays.length || 1);
    
    let probability = 'Low';
    if (consistency > 0.85) probability = 'Very High';
    else if (consistency > 0.7) probability = 'High';
    else if (consistency > 0.4) probability = 'Medium';

    return {
      probability,
      consistency: (consistency * 100).toFixed(1),
      recommendation: this.getStreakRecommendation(consistency)
    };
  }

  calculateTrend(total, count) {
    if (count < 2) return 'neutral';
    const average = total / count;
    if (average > 2) return 'increasing';
    if (average < 1) return 'decreasing';
    return 'stable';
  }

  calculateRiskLevel(averageDaily) {
    if (averageDaily > 8) return 'high';
    if (averageDaily > 4) return 'medium';
    return 'low';
  }

  getStreakRecommendation(consistency) {
    if (consistency > 0.8) return 'Great consistency! Keep it up!';
    if (consistency > 0.5) return 'Try to maintain daily tracking';
    return 'Set reminders to improve consistency';
  }

  // Generate AI-powered personalized quotes
  generatePersonalizedQuote(patterns, currentLevel) {
    const quotes = {
      "og smoker": [
        "Your rotation mastery is legendary! The true soul of the session.",
        "You've reached peak cholo status - keep the vibes immaculate!",
        "Highest in the room detected! Your rotation flow is inspiring."
      ],
      regular: [
        "You're building the perfect rhythm! Keep the rotation moving.",
        "Your rotation discipline is top-tier!",
        "Steady puffs, blunt warrior! Keep those vibes high."
      ],
      social: [
        "Every legend starts with a first puff. Your journey begins!",
        "Small steps, big clouds. Keep tracking, stay lifted!",
        "The path to rotation mastery starts here. Stay consistent!"
      ],
      low: [
         "Ready to spark your first session? The homies are waiting!",
         "Consistency is key to a perfect high. Keep it up!",
         "Welcome to the tracker. Let's build those stats!"
      ]
    };

    const level = patterns.bluntTolerancePattern?.level?.toLowerCase() || 'low';
    const levelQuotes = quotes[level] || quotes.low;
    return levelQuotes[Math.floor(Math.random() * levelQuotes.length)];
  }

  // Smart goal suggestions
  suggestOptimalGoals(patterns, currentGoals) {
    const suggestions = [];
    const tolerance = patterns.bluntTolerancePattern;
    
    if (tolerance.level === 'OG Smoker' && tolerance.riskLevel === 'high') {
      suggestions.push({
        type: 'reduction',
        title: 'T-Break Recommended',
        description: `Consider skipping a few sessions to reset your tolerance`,
        targetValue: Math.max(1, parseFloat(tolerance.averageDaily) - 2)
      });
    }

    if (patterns.streakPrediction.probability === 'High') {
      suggestions.push({
        type: 'streak',
        title: 'Streak Challenge',
        description: 'You\'re on fire! Challenge yourself to reach 30 days',
        targetValue: 30
      });
    }

    return suggestions;
  }

  // Predictive analytics for optimal consumption times
  predictOptimalConsumptionTimes(patterns) {
    const timePrefs = patterns.timePreferences;
    const recommendations = [];

    if (parseFloat(timePrefs.morning.percentage) > 50) {
      recommendations.push({
        time: 'morning',
        reason: 'Peak productivity hours',
        suggestion: 'Perfect timing for a wake and bake!'
      });
    }

    if (parseFloat(timePrefs.evening.percentage) > 30) {
      recommendations.push({
        time: 'evening',
        reason: 'Late night sessions',
        suggestion: 'Munchies incoming! Prepare the snacks.'
      });
    }

    return recommendations;
  }
}

// Global AI engine instance
export const aiEngine = new AIInsightsEngine();

// Cached AI insights hook
export const useAIInsights = (consumptionData, currentLevel) => {
  const cacheKey = `ai_insights_${JSON.stringify(consumptionData)}_${currentLevel?.level}`;
  
  let insights = apiCache.get(cacheKey);
  
  if (!insights) {
    const patterns = aiEngine.analyzeConsumptionPatterns(consumptionData);
    insights = {
      patterns,
      personalizedQuote: aiEngine.generatePersonalizedQuote(patterns, currentLevel),
      goalSuggestions: aiEngine.suggestOptimalGoals(patterns, {}),
      timeRecommendations: aiEngine.predictOptimalConsumptionTimes(patterns),
      riskAssessment: {
        level: patterns.bluntTolerancePattern.riskLevel,
        recommendation: patterns.bluntTolerancePattern.recommendation
      }
    };
    
    apiCache.set(cacheKey, insights);
  }
  
  return insights;
};

// Real-time pattern detection
export const detectConsumptionAnomalies = (consumptionData) => {
  const recent = consumptionData.slice(-7);
  const historical = consumptionData.slice(0, -7);
  
  if (historical.length < 7) return null;
  
  const recentAvg = recent.reduce((sum, day) => sum + (day.blunts || []).length, 0); // Total this week
  const historicalAvg = historical.reduce((sum, day) => sum + (day.blunts || []).length, 0) / (historical.length / 7 || 1); // Weekly avg of past
  
  const change = ((recentAvg - historicalAvg) / historicalAvg) * 100;
  
  if (Math.abs(change) > 50) {
    return {
      type: change > 0 ? 'increase' : 'decrease',
      magnitude: Math.abs(change).toFixed(1),
      recommendation: change > 0 
        ? 'Significant increase detected. Check your stash management!'
        : 'Significant decrease detected. The rotation misses you!'
    };
  }
  
  return null;
};