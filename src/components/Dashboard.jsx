import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
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
  Euro,
  ShoppingCart,
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
const calculateTotalBlunts = mockData.calculateTotalBlunts;
const calculateTotalCost = mockData.calculateTotalCost;

// Mapeo de nombres completos a nombres resumidos para el tooltip
const bluntNameShortMap = {
  'Classic Joint': 'Joint',
  'Backwoods Blunt': 'Backwoods',
  'Hemp Wrap Blunt': 'Hemp Wrap'
};

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
  }) => {
    const [chartView, setChartView] = useState('daily');
    const [chartMonthOffset, setChartMonthOffset] = useState(0);
    const [selectedChartDate, setSelectedChartDate] = useState(null);
    const [todayQuote, setTodayQuote] = useState('');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [deletingDrink, setDeletingDrink] = useState(null);
    const [showAIInsights, setShowAIInsights] = useState(true);
    const chartRef = useRef(null);

    useEffect(() => {
      setTodayQuote(mockData.getTodayQuote());
    }, []);

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
          onDrinkDelete(drinkIndex);
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
                    `Avg: ${chartDataEntry.avgBlunts} per day`
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
      <div className='space-y-8'>
        <motion.div
          className='relative overflow-hidden bg-gray-950/30 rounded-2xl p-6 md:p-8 border border-white/5 shadow-xl mx-auto w-full max-w-xl flex items-center justify-center backdrop-blur-sm'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          {/* Background Smoke Image */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <motion.img 
              src="/blunt-images/smoke.png" 
              alt="smoke background"
              className="w-full h-full object-cover opacity-15 mix-blend-lighten scale-110"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ 
                scale: [1.1, 1.12, 1.1],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ 
                duration: 12,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </div>

          <div 
            className='relative z-10 text-xl md:text-3xl lg:text-4xl text-center text-white/80 tracking-[0.15em] leading-relaxed select-none px-4'
            style={{ fontFamily: "'UnifrakturMaguntia', cursive" }}
          >
            {todayQuote}
          </div>

          {/* Subtle Vignette */}
          <div className="absolute inset-0 z-1 bg-radial-gradient from-transparent via-transparent to-gray-950/40 pointer-events-none" />
        </motion.div>

        {/* AI Insights Panel */}
        <Suspense
          fallback={
            <div className='bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl p-6 border border-purple-500/20 animate-pulse'>
              <div className='h-40 bg-gray-800/50 rounded-lg'></div>
            </div>
          }
        >
          <AIInsightsPanel
            consumptionData={consumptionData}
            leaderboardData={leaderboardData || []}
            currentLevel={memoizedStats.currentLevel}
            isVisible={showAIInsights}
          />
        </Suspense>

        {/* Rotation Circle / Main Mechanic */}
        <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>}>
          <RotationCircle 
            currentUser={currentUser || "You"} 
            onAddRotation={async (rotationData) => {
              // Create the API request
              const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
              try {
                const res = await fetch(`${backendUrl}/api/rotation`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify(rotationData)
                });
                
                if (!res.ok) {
                   console.error("Failed to add rotation");
                } else {
                   // Optimistically update the UI by calling onDrinkSelect to trigger a refresh
                   onDrinkSelect({
                     id: rotationData.bluntType,
                     selectedPrice: 0,
                     caffeine: 0,
                     date: new Date().toISOString().split('T')[0]
                   });
                }
              } catch (e) {
                console.error("Error submitting rotation", e);
              }
            }}
            isLoading={isTransitioning}
          />
        </Suspense>

        {/* Stats Grid - Grouped Design */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6'>
          {/* Today's Blunts */}
          <motion.div
            className='bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 md:p-6 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:scale-105'
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          >
            <div className='flex items-center gap-3 mb-4'>
              <motion.div
                className='p-1.5 bg-green-500 rounded-lg shadow-sm'
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <img src="/blunt-images/fav_png.png" alt="Icon" className="w-7 h-7 rounded object-cover" />
              </motion.div>
              <h3 className='blunt-title text-xl md:text-2xl'>
                Today's Blunts
              </h3>
            </div>
            <p className='text-2xl font-bold text-green-400'>
              {todayData.blunts ? todayData.blunts.length : 0}
            </p>
            <p className='text-xs text-gray-400 mt-1'>blunts smoked</p>
          </motion.div>

          {/* Combined Rotation Profile Card */}
          <motion.div
            className='bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 md:p-6 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 hover:scale-105 col-span-1 md:col-span-2'
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          >
            <div className='flex items-center gap-3 mb-6'>
              <motion.div
                className='p-2 bg-yellow-500 rounded-lg'
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Zap className='w-6 h-6 text-black' />
              </motion.div>
              <h3 className='blunt-title text-2xl md:text-3xl'>
                Rotation Profile
              </h3>
            </div>

            <div className='grid grid-cols-2 gap-6'>
              <div className='text-center'>
                <p className='text-2xl font-bold text-yellow-400'>
                  {todayData.blunts ? todayData.blunts.length : 0}
                </p>
                <p className='text-sm text-gray-400 mt-1'>Today's Blunts</p>
              </div>

              <div className='text-center border-l border-gray-700 pl-6'>
                <p className='text-2xl font-bold text-yellow-300'>
                  {memoizedStats.totalBlunts}
                </p>
                <p className='text-sm text-gray-400 mt-1'>Total Blunts</p>
                <p className='text-xs text-gray-500 mt-1'>Smoked all time</p>
              </div>
            </div>
          </motion.div>

          {/* Total Blunts */}
          <motion.div
            className='bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 hover:scale-105'
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          >
            <div className='flex items-center gap-3 mb-4'>
              <motion.div
                className='p-2 bg-cyan-500 rounded-lg'
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Target className='w-6 h-6 text-black' />
              </motion.div>
              <h3 className='blunt-subtitle text-sm md:text-base'>
                Blunts Saved
              </h3>
            </div>
            <p className='text-2xl font-bold text-cyan-400'>
              {memoizedStats.totalBlunts}
            </p>
            <p className='text-xs text-gray-400 mt-1'>smoked all time</p>
          </motion.div>

          {/* Total Money Spent */}
          <motion.div
            className='bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 hover:scale-105'
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
          >
            <div className='flex items-center gap-3 mb-4'>
              <motion.div
                className='p-2 bg-yellow-500 rounded-lg'
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <Euro className='w-6 h-6 text-black' />
              </motion.div>
              <h3 className='blunt-subtitle text-sm md:text-base'>Money Spent</h3>
            </div>
            <p className='text-2xl font-bold text-yellow-400'>
              {(memoizedStats.totalCost || 0).toFixed(2)} €
            </p>
            <p className='text-xs text-gray-400 mt-1'>total invested</p>
          </motion.div>

          {/* Blunt Level */}
          <motion.div
            className='bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:scale-105'
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
          >
            <div className='flex items-center gap-3 mb-4'>
              <motion.div
                className='p-2 bg-blue-500 rounded-lg'
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Trophy className='w-6 h-6 text-white' />
              </motion.div>
              <h3 className='blunt-title text-xl md:text-2xl'>
                Smoker Level
              </h3>
            </div>
            <div className='flex items-center gap-2'>
              <motion.span
                className='text-xl'
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {memoizedStats.currentLevel.badge}
              </motion.span>
              <div>
                <p className='text-lg font-bold text-white'>
                  {memoizedStats.currentLevel.name}
                </p>
                <p className='text-xs text-gray-400'>
                  Level {memoizedStats.currentLevel.level}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Combined Streak Card */}
          <motion.div
            className='bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 hover:scale-105 col-span-1 md:col-span-2 flex flex-col items-center justify-center w-full max-w-xl mx-auto my-8'
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
          >
            <div className='flex flex-col items-center w-full'>
              <div className='flex items-center gap-3 mb-6'>
                <motion.div
                  className='p-2 bg-orange-500 rounded-lg'
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Calendar className='w-6 h-6 text-white' />
                </motion.div>
                  <h3 className='blunt-title text-xl md:text-2xl'>
                    Streak Tracking
                  </h3>
              </div>
              <div className='grid grid-cols-2 gap-6 w-full'>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-orange-400'>
                    {memoizedStats.streak} days
                  </p>
                  <p className='text-sm text-gray-400 mt-1'>Current Streak</p>
                  <p className='text-xs text-gray-500 mt-1'>Keep it going!</p>
                </div>
                <div className='text-center border-l border-gray-700 pl-6'>
                  <p className='text-2xl font-bold text-purple-400'>
                    {bestStreak} days
                  </p>
                  <p className='text-sm text-gray-400 mt-1'>Best Streak</p>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Trophies Display */}
          <motion.div
            className='bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 col-span-1 md:col-span-2 xl:col-span-6 flex flex-col w-full mx-auto my-4 shadow-xl'
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.7, ease: 'easeOut' }}
          >
            <div className='flex items-center gap-3 mb-6'>
              <motion.div
                className='p-2 bg-purple-500 rounded-lg'
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <Award className='w-6 h-6 text-white' />
              </motion.div>
              <h3 className='blunt-title text-2xl md:text-3xl'>
                Smoker Trophies
              </h3>
            </div>
            
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 w-full'>
              {(memoizedStats.achievements[memoizedStats.currentLevel.level] || []).map((trophy) => (
                <motion.div 
                  key={trophy.id}
                  className={`p-4 rounded-xl border flex items-center gap-4 transition-all duration-500 ${
                    trophy.achieved 
                      ? 'border-green-500/50 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                      : 'border-gray-700 bg-gray-800/30 opacity-60'
                  }`}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className={`text-4xl filter transition-all duration-500 ${trophy.achieved ? 'drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'grayscale opacity-50'}`}>
                    {trophy.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-lg truncate">{trophy.name}</p>
                    <p className="text-xs text-gray-400 mb-2">{trophy.description}</p>
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mt-1">
                      <motion.div 
                        className={`h-full ${trophy.achieved ? 'bg-green-500' : 'bg-purple-500/50'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${trophy.percentage}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                  {trophy.achieved && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-green-500 rounded-full p-1 shadow-lg"
                    >
                      <Award className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Level Up Hint */}
            {memoizedStats.achievements[memoizedStats.currentLevel.level] && !memoizedStats.achievements[memoizedStats.currentLevel.level].every(t => t.achieved) && (
              <div className="mt-6 p-4 rounded-xl bg-purple-500/5 shadow-inner border border-purple-500/10 text-center">
                <p className="text-sm text-purple-300 flex items-center justify-center gap-2">
                  <Flame className="w-4 h-4 animate-pulse" />
                  Mission: Complete all {memoizedStats.currentLevel.name} trophies to reach the next level!
                </p>
              </div>
            )}
          </motion.div>

        </div>

        {/* Chart Section */}
        <motion.div
          className='bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 md:p-8 border border-green-500/20 hover:border-green-500/30 transition-all duration-300'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
        >
          <div className='flex flex-col items-start mb-6 gap-4'>
            <div className='flex flex-col sm:flex-row justify-between w-full items-start sm:items-center gap-4'>
              <h3 className='text-4xl md:text-5xl text-white blunt-title'>
                Consumption Analytics
              </h3>
            </div>

            <div className='flex flex-col items-start gap-4'>
              <div className='flex gap-2'>
                <motion.button
                  onClick={() => handleChartViewChange('daily')}
                  className={`px-4 py-1.5 rounded-lg transition-all duration-300 blunt-subtitle border-2 text-xs md:text-sm ${
                    chartView === 'daily'
                      ? 'bg-gray-700/80 text-white border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                      : 'bg-gray-800/40 text-gray-500 border-gray-700 hover:border-gray-600 hover:text-gray-300'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Daily
                </motion.button>
                <motion.button
                  onClick={() => handleChartViewChange('annual')}
                  className={`px-4 py-1.5 rounded-lg transition-all duration-300 blunt-subtitle border-2 text-xs md:text-sm ${
                    chartView === 'annual'
                      ? 'bg-gray-700/80 text-white border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                      : 'bg-gray-800/40 text-gray-500 border-gray-700 hover:border-gray-600 hover:text-gray-300'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Annual
                </motion.button>
              </div>
              
              {chartView === 'daily' && (
                <div className='flex items-center justify-center gap-3 bg-gray-800/80 rounded-lg px-3 py-1.5 border border-green-500/20'>
                  <button
                    onClick={() => {
                        setChartMonthOffset(prev => prev - 1);
                        setSelectedChartDate(null);
                    }}
                    className='p-1 hover:bg-gray-700 rounded-md text-gray-400 hover:text-green-400 transition-colors'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 19l-7-7 7-7'></path></svg>
                  </button>
                  
                  <span className='text-sm font-semibold text-green-50 min-w-24 text-center tracking-wide'>
                    {(() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + chartMonthOffset);
                      return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                    })()}
                  </span>
                  
                  <button
                    onClick={() => {
                        setChartMonthOffset(prev => prev + 1);
                        setSelectedChartDate(null);
                    }}
                    className='p-1 hover:bg-gray-700 rounded-md text-gray-400 hover:text-green-400 transition-colors'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7'></path></svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className='h-64 sm:h-80 md:h-96 relative'>
            <AnimatePresence mode='wait'>
              {!isTransitioning && (
                <motion.div
                  key={chartView}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className='h-full w-full'
                >
                  <Line
                    ref={chartRef}
                    data={chartData}
                    options={chartOptions}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {isTransitioning && (
              <div className='absolute inset-0 flex items-center justify-center'>
                <motion.div
                  className='w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full'
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Dynamic Blunts Details - Shows Today or Selected Chart Date */}
        {(() => {
          const displayDate = selectedChartDate || new Date().toISOString().split('T')[0];
          const isViewingPast = !!selectedChartDate && selectedChartDate !== new Date().toISOString().split('T')[0];
          const displayData = consumptionData.find(d => d.date === displayDate) || { blunts: [] };
          const bluntsArray = displayData.blunts || [];
          
          if (bluntsArray.length === 0 && !isViewingPast) return null;

          return (
            <motion.div
              key={displayDate} // Force re-animation when date changes
              className='bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 md:p-8 border border-green-500/20'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div className='flex flex-col items-center justify-center mb-6 gap-2'>
                {isViewingPast ? (
                  <div className='text-center'>
                    <h3 className='blunt-title text-xl md:text-2xl'>
                      Consumption On
                    </h3>
                    <h4 className='blunt-subtitle text-lg md:text-xl'>
                      {new Date(displayDate).toLocaleDateString()}
                    </h4>
                  </div>
                ) : (
                  <div className='flex items-center justify-between w-full'>
                    <h3 className='text-2xl md:text-3xl text-white blunt-title'>
                      Today's Blunts
                    </h3>
                    <p className='text-gray-400 text-sm hidden sm:block'>Hover to remove blunts</p>
                  </div>
                )}
              </div>

              {bluntsArray.length === 0 ? (
                <p className="text-gray-400 italic text-center py-6">No blunts logged for this date.</p>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  <AnimatePresence>
                    {bluntsArray.map((blunt, index) => {
                      const bluntData = mockData.bluntDrinks.find(
                        (d) => d.id === blunt.id
                      );
                      const isDeleting = deletingDrink === index;

                      return (
                        <motion.div
                          key={`${blunt.id}-${index}-${displayDate}`}
                          className='relative group'
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{
                            opacity: 0,
                            x: -100,
                            scale: 0.8,
                            transition: { duration: 0.3 },
                          }}
                          transition={{
                            duration: 0.5,
                            delay: index * 0.1,
                            ease: 'easeOut',
                          }}
                          layout
                        >
                          <div
                            className={`flex items-center gap-4 bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all duration-300 ${
                              isDeleting
                                ? 'bg-red-900/50 border border-red-500/50'
                                : ''
                            }`}
                          >
                            <motion.img
                              src="/blunt-images/fav_png.png"
                              alt={bluntData?.name}
                              className='w-12 h-12 rounded object-cover border border-gray-700'
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.2 }}
                              loading='lazy'
                            />
                            <div className='flex-1'>
                              <p className='text-white font-semibold'>
                                {bluntData?.name || 'Blunt'}
                              </p>
                              <div className='flex items-center gap-4 text-sm'>
                                {blunt.spot && (
                                  <p className='text-green-400'>
                                    📍 {blunt.spot}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Delete Button */}
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                if(typeof onDrinkDelete === 'function') {
                                  onDrinkDelete(index, displayDate);
                                } else {
                                  handleDeleteDrink(index, displayDate);
                                }
                              }}
                              className='opacity-0 group-hover:opacity-100 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200'
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              disabled={isDeleting}
                              title='Remove this blunt'
                            >
                              {isDeleting ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: 'linear',
                                  }}
                                >
                                  <X className='w-4 h-4' />
                                </motion.div>
                              ) : (
                                <Trash2 className='w-4 h-4' />
                              )}
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              {/* Return to Today Button (Only shows when viewing past) */}
              {isViewingPast && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => {
                      setSelectedChartDate(null);
                      setChartMonthOffset(0);
                    }}
                    className="flex items-center gap-2 px-6 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-green-500 rounded-full text-sm font-medium text-white transition-all duration-300"
                  >
                    <X className="w-4 h-4 text-green-400" />
                    Return to Today
                  </button>
                </div>
              )}
            </motion.div>
          );
        })()}

      </div>
    );
  }
);

Dashboard.displayName = 'Dashboard';

export default Dashboard;
