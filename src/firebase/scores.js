import { database } from './config';
import { ref, push, get, query, orderByChild, limitToLast } from 'firebase/database';

export const saveScore = async (gameName, difficulty, score, playerName = 'Anonymous') => {
  try {
    const scoresRef = ref(database, 'scores');
    await push(scoresRef, {
      gameName,
      difficulty: difficulty || 'N/A',
      score,
      playerName,
      timestamp: Date.now()
    });
    return true;
  } catch (error) {
    console.error('Error saving score:', error);
    return false;
  }
};

export const getHighScores = async (gameName, difficulty = null, limit = 10) => {
  try {
    const scoresRef = ref(database, 'scores');
    let scoresQuery = query(scoresRef, orderByChild('score'), limitToLast(limit));
    
    const snapshot = await get(scoresQuery);
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
    
    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, limit);
  } catch (error) {
    console.error('Error fetching scores:', error);
    return [];
  }
};

