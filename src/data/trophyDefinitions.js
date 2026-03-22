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
