import { useState, useEffect } from 'react';
import { saveScore, getHighScores } from '../../firebase/scores';
import './MemoryGrid.css';

function MemoryGrid({ difficulty, onBack }) {
  const [grid, setGrid] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [highScores, setHighScores] = useState([]);
  const [canFlip, setCanFlip] = useState(true);
  const [highestScore, setHighestScore] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const difficultyConfig = {
    easy: { size: 4, pairs: 8 },
    medium: { size: 6, pairs: 18 },
    expert: { size: 8, pairs: 32 }
  };

  const config = difficultyConfig[difficulty] || difficultyConfig.easy;

  useEffect(() => {
    initializeGame();
    loadHighScores();
    lockOrientation();
  }, [difficulty]);
  
  const lockOrientation = () => {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {
        if (screen.lockOrientation) {
          screen.lockOrientation('landscape');
        } else if (screen.mozLockOrientation) {
          screen.mozLockOrientation('landscape');
        } else if (screen.msLockOrientation) {
          screen.msLockOrientation('landscape');
        }
      });
    }
  };

  useEffect(() => {
    let interval = null;
    if (gameStatus === 'playing') {
      interval = setInterval(() => {
        setTime(time => {
          const newTime = time + 1;
          // Update countdown timer if we have a highest score
          if (highestScore && highestScore.time) {
            const remaining = highestScore.time - newTime;
            // Freeze at 0 once passed the record time
            setTimeRemaining(remaining >= 0 ? remaining : 0);
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus, highestScore]);

  const initializeGame = () => {
    // Create a standard deck of 52 playing cards
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const fullDeck = [];
    
    // Create all 52 cards
    for (let suit of suits) {
      for (let rank of ranks) {
        fullDeck.push({ suit, rank, id: `${suit}-${rank}-${Math.random()}` });
      }
    }
    
    // Group cards by rank - each rank has 4 cards (one per suit)
    const rankGroups = {};
    fullDeck.forEach(card => {
      if (!rankGroups[card.rank]) {
        rankGroups[card.rank] = [];
      }
      rankGroups[card.rank].push(card);
    });
    
    // Create pairs - each rank can make 2 pairs (4 cards = 2 pairs)
    // We need config.pairs pairs total
    const allPairs = [];
    const ranksList = Object.keys(rankGroups);
    
    // Shuffle ranks to randomize
    for (let i = ranksList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ranksList[i], ranksList[j]] = [ranksList[j], ranksList[i]];
    }
    
    // Create pairs from ranks until we have enough
    for (let rank of ranksList) {
      const cards = rankGroups[rank];
      // Shuffle the 4 cards of this rank
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }
      // Make 2 pairs from the 4 cards
      allPairs.push(cards[0], cards[1]); // Pair 1
      allPairs.push(cards[2], cards[3]); // Pair 2
      
      if (allPairs.length >= config.pairs * 2) break;
    }
    
    // Take only what we need for the grid
    const gridSize = config.size * config.size;
    const cardsToUse = allPairs.slice(0, gridSize);
    
    // Shuffle the selected cards
    for (let i = cardsToUse.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardsToUse[i], cardsToUse[j]] = [cardsToUse[j], cardsToUse[i]];
    }
    
    // Create grid
    const newGrid = [];
    for (let i = 0; i < cardsToUse.length; i++) {
      newGrid.push({
        id: i,
        card: cardsToUse[i],
        flipped: false,
        matched: false
      });
    }
    
    setGrid(newGrid);
    setFlippedCards([]);
    setMatchedPairs([]);
    setGameStatus('playing');
    setMoves(0);
    setTime(0);
    setCanFlip(true);
  };

  const handleCardClick = (card) => {
    if (!canFlip || card.flipped || card.matched || flippedCards.length >= 2) {
      return;
    }

    const newGrid = grid.map(c => 
      c.id === card.id ? { ...c, flipped: true } : c
    );
    setGrid(newGrid);
    
    const newFlipped = [...flippedCards, card.id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setCanFlip(false);
      setMoves(moves + 1);
      
      const [firstId, secondId] = newFlipped;
      const firstCard = newGrid.find(c => c.id === firstId);
      const secondCard = newGrid.find(c => c.id === secondId);

      // Match by rank only (not exact card)
      if (firstCard.card.rank === secondCard.card.rank) {
        // Match found
        setTimeout(() => {
          const updatedGrid = newGrid.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, matched: true, flipped: false }
              : c
          );
          setGrid(updatedGrid);
          setMatchedPairs([...matchedPairs, firstId, secondId]);
          setFlippedCards([]);
          setCanFlip(true);
          
          // Check if game is won
          if (matchedPairs.length + 2 >= config.pairs * 2) {
            setGameStatus('won');
            setShowNameInput(true);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const updatedGrid = newGrid.map(c => 
            c.id === firstId || c.id === secondId
              ? { ...c, flipped: false }
              : c
          );
          setGrid(updatedGrid);
          setFlippedCards([]);
          setCanFlip(true);
        }, 1000);
      }
    }
  };

  const loadHighScores = async () => {
    const scores = await getHighScores('Memory Grid', difficulty);
    setHighScores(scores);
    
    // Get the best score (lowest time is best)
    if (scores.length > 0) {
      // Find score with lowest time (best performance)
      const bestScore = scores.reduce((best, current) => {
        const currentTime = current.time || Infinity;
        const bestTime = best.time || Infinity;
        return currentTime < bestTime ? current : best;
      }, scores[0]);
      
      setHighestScore(bestScore);
      if (bestScore.time) {
        setTimeRemaining(bestScore.time);
      } else {
        setTimeRemaining(null);
      }
    } else {
      setHighestScore(null);
      setTimeRemaining(null);
    }
  };

  const handleSaveScore = async () => {
    if (!playerName.trim()) return;
    // Score based on time and moves (lower is better, so we invert)
    const score = Math.max(0, 10000 - (time * 10) - (moves * 50));
    const success = await saveScore('Memory Grid', difficulty, score, playerName, time, moves);
    if (success) {
      setShowNameInput(false);
      await loadHighScores();
      // Check if this is a new record (lower time is better)
      if (!highestScore || (highestScore.time && time < highestScore.time)) {
        alert('🎉 New Record! You beat the previous best time!');
      }
    } else {
      alert('Failed to save score. Please check your connection and try again.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="memory-grid-game">
      <button className="back-button" onClick={onBack}>← Back to Menu</button>
      
      <div className="memory-container">
        <div className="memory-header">
          <h1>Memory Grid - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</h1>
          <button onClick={initializeGame} className="new-game-btn">New Game</button>
        </div>

        <div className="game-stats">
          <div className="stat">
            <span className="stat-label">Time:</span>
            <span className="stat-value">{formatTime(time)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Moves:</span>
            <span className="stat-value">{moves}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Pairs Found:</span>
            <span className="stat-value">{matchedPairs.length / 2} / {config.pairs}</span>
          </div>
          {highestScore && highestScore.time && (
            <div className="stat">
              <span className="stat-label">Best Time:</span>
              <span className="stat-value">{formatTime(highestScore.time)}</span>
            </div>
          )}
        </div>
        
        {timeRemaining !== null && highestScore && highestScore.time && gameStatus === 'playing' && (
          <div className="countdown-timer">
            <div className="countdown-label">Time to beat record:</div>
            <div className="countdown-bar-container">
              <div 
                className="countdown-bar" 
                style={{ 
                  width: `${Math.max(0, Math.min(100, (timeRemaining / highestScore.time) * 100))}%`,
                  backgroundColor: timeRemaining > highestScore.time * 0.5 ? '#28a745' : timeRemaining > highestScore.time * 0.25 ? '#ffc107' : '#dc3545'
                }}
              />
            </div>
            <div className="countdown-time">
              {timeRemaining > 0 ? formatTime(timeRemaining) : '0:00 (Record beaten!)'}
            </div>
          </div>
        )}
        
        {timeRemaining !== null && timeRemaining === 0 && time > highestScore.time && gameStatus === 'playing' && (
          <div className="record-beaten">
            🎉 You beat the record! Keep going!
          </div>
        )}

        {gameStatus === 'won' && showNameInput && (
          <div className="score-modal">
            <h2>Congratulations! You completed the game!</h2>
            <p>Time: {formatTime(time)} | Moves: {moves}</p>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="name-input"
            />
            <button onClick={handleSaveScore} className="save-score-btn">Save Score</button>
          </div>
        )}

        <div 
          className="memory-grid" 
          style={{ 
            gridTemplateColumns: `repeat(${config.size}, 1fr)`,
            maxWidth: `${config.size * 90}px`
          }}
        >
          {grid.map(card => (
            <div
              key={card.id}
              className={`memory-card ${card.flipped ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
              onClick={() => handleCardClick(card)}
            >
              <div className="card-front">🂠</div>
              <div className={`card-back ${card.card.suit === '♥' || card.card.suit === '♦' ? 'red' : ''}`}>
                <span className="card-rank">{card.card.rank}</span>
                <span className="card-suit">{card.card.suit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="high-scores">
          <h3>High Scores - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</h3>
          <div className="scores-list">
            {highScores.length > 0 ? (
              highScores.map((score, index) => (
                <div key={score.id} className="score-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{score.playerName}</span>
                  <span className="score">{score.score}</span>
                </div>
              ))
            ) : (
              <p>No scores yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemoryGrid;


