import { database } from './config';
import { ref, push, get, query, orderByChild, limitToLast } from 'firebase/database';

export const saveScore = async (gameName, difficulty, score, playerName = 'Anonymous', time = null, moves = null) => {
  try {
    const scoresRef = ref(database, 'scores');
    const scoreData = {
      gameName,
      difficulty: difficulty || 'N/A',
      score,
      playerName,
      timestamp: Date.now()
    };
    
    // Add time and moves if provided
    if (time !== null) scoreData.time = time;
    if (moves !== null) scoreData.moves = moves;
    
    await push(scoresRef, scoreData);
    return true;
  } catch (error) {
    console.error('Error saving score:', error);
    return false;
  }
};

export const getHighScores = async (gameName, difficulty = null, limit = 10) => {
  try {
    const scoresRef = ref(database, 'scores');
    
    // Fetch all scores without ordering to avoid permission/index issues
    // We'll filter and sort in JavaScript instead
    const snapshot = await get(scoresRef);
    if (!snapshot.exists()) {
      return [];
    }
    
    const scores = [];
    snapshot.forEach((child) => {
      const scoreData = child.val();
      if (scoreData.gameName === gameName) {
        if (!difficulty || scoreData.difficulty === difficulty) {
          scores.push({
            id: child.key,
            ...scoreData
          });
        }
      }
    });
    
    // Sort by score descending for most games, but time ascending for memory games
    if (gameName.includes('Memory Grid')) {
      scores.sort((a, b) => (a.time || Infinity) - (b.time || Infinity));
    } else {
      scores.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
    
    return scores.slice(0, limit);
  } catch (error) {
    // Silently handle permission errors - Firebase rules may restrict access
    // Only log if it's not a permission error
    if (error.code !== 'PERMISSION_DENIED' && error.message && !error.message.includes('Permission denied')) {
      console.warn('Error fetching scores:', error.message);
    }
    return [];
  }
};

