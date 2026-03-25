// Trophy definitions for the Blunt Tracker tiered progression system

export const TROPHY_LEVELS = {
  1: [
    { id: 'first_spark', name: 'First Spark', icon: '🕯️', description: 'Complete your first rotation with a friend.', type: 'rotation_count', goal: 1 },
    { id: 'explorer', name: 'Explorer', icon: '📍', description: 'Record a session at a specific spot.', type: 'unique_spots', goal: 1 },
    { id: 'sponsor_spirit', name: 'Sponsor Spirit', icon: '💵', description: 'Host your first blunt (be the sponsor).', type: 'sponsor_count', goal: 1 }
  ],
  2: [
    { id: 'social_smoker', name: 'Social Smoker', icon: '🤝', description: 'Complete 3 rotations with 3+ participants.', type: 'group_rotations', goal: 3, participantsRequired: 3 },
    { id: 'weekend_warrior', name: 'Weekend Warrior', icon: '⚔️', description: 'Smoke on both Saturday and Sunday in one week.', type: 'weekend_streak', goal: 1 },
    { id: 'local_legend', name: 'Local Legend', icon: '🏘️', description: 'Visit 3 different spots.', type: 'unique_spots', goal: 3 }
  ],
  3: [
    { id: 'master_ceremony', name: 'Master of Ceremony', icon: '💰', description: 'Be the sponsor for 10 blunts total.', type: 'sponsor_count', goal: 10 },
    { id: 'the_circle', name: 'The Circle', icon: '⭕', description: 'Complete a rotation with 5+ people.', type: 'max_participants', goal: 5 },
    { id: 'stay_lifted', name: 'Stay Lifted', icon: '🔥', description: 'Maintain a 4-day smoke streak.', type: 'streak', goal: 4 }
  ],
  4: [
    { id: 'nube_ocios', name: 'Nube de Ocios', icon: '☁️', description: 'Smoke 10+ blunts in a single week.', type: 'weekly_count', goal: 10 },
    { id: 'globe_trotter', name: 'Globe Trotter', icon: '🌍', description: 'Visit 8 different spots.', type: 'unique_spots', goal: 8 },
    { id: 'generous_soul', name: 'Generous Soul', icon: '😇', description: 'Sponsor a session with 4+ participants.', type: 'sponsor_group', goal: 1, participantsRequired: 4 }
  ],
  5: [
    { id: 'olympic_lungs', name: 'Olympic Lungs', icon: '🏅', description: 'Maintain a perfect 14-day streak.', type: 'streak', goal: 14 },
    { id: 'the_godfather', name: 'The Godfather', icon: '🕶️', description: 'Share 10+ sessions with 5 different friends.', type: 'deep_buddies', goal: 5, sessionsRequired: 10 },
    { id: 'cloud_atlas', name: 'Cloud Atlas', icon: '⚡', description: 'Visit 15 different spots.', type: 'unique_spots', goal: 15 }
  ]
};

export const OPTIONAL_ACHIEVEMENTS = [
  { id: 'el_junador', name: 'El Mayor Junador', icon: '🪳', description: 'Smoke 10 blunts without paying a single cent (Freeloader).', type: 'freeloader', goal: 10 },
  { id: 'iron_lungs', name: 'Inhalador de Alquitrán', icon: '🫁', description: 'Maintain a 5-day streak without failing.', type: 'streak', goal: 5 },
  { id: 'night_owl', name: 'Buenas Noches', icon: '🦉', description: 'Smoke 5 times after midnight.', type: 'night_smoker', goal: 5 },
  { id: 'early_bird', name: 'Buenos Días', icon: '🌅', description: 'Smoke 5 times before 10:00 AM.', type: 'morning_smoker', goal: 5 },
  { id: 'sugar_daddy', name: 'Sugar Daddy', icon: '💸', description: 'Pay for 20 blunts entirely out of your own pocket.', type: 'sponsor_count', goal: 20 },
  { id: 'veteran', name: 'Veteran Smoker', icon: '🎖️', description: 'Smoke a total of 100 blunts.', type: 'total_blunts', goal: 100 },
  { id: 'lone_wolf', name: 'Autista Empedernido', icon: '🤕', description: 'Complete 20 rotations completely alone.', type: 'solo_smokes', goal: 20 },
  { id: 'shaman', name: 'El Chamán', icon: '🧙‍♂️', description: 'Participate in a massive rotation of 7 or more people.', type: 'large_rotation_count', goal: 1 },
  { id: 'fat_blunt', name: 'El Gordo', icon: '🪵', description: 'Roll or participate in a blunt weighing 1.5g or more.', type: 'fatty_blunt', goal: 1 },
  { id: 'explorer', name: 'Explorer', icon: '🗺️', description: 'Smoke blunts in 5 completely different spots.', type: 'spot_explorer', goal: 5 },
  { id: 'chimney', name: 'La Chimenea', icon: '🏭', description: 'Smoke 5 or more blunts in a single day.', type: 'daily_max', goal: 5 },
  { id: 'heavyweight', name: 'Heavyweight', icon: '🏋️‍♂️', description: 'Smoke a cumulative total of 10 grams over time.', type: 'total_weight', goal: 10 }
];
