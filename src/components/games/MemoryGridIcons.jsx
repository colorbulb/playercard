import { useState, useEffect } from 'react';
import { saveScore, getHighScores } from '../../firebase/scores';
import './MemoryGridIcons.css';

function MemoryGridIcons({ difficulty, onBack }) {
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
    // Force landscape orientation
    lockOrientation();
  }, [difficulty]);

  useEffect(() => {
    let interval = null;
    if (gameStatus === 'playing') {
      interval = setInterval(() => {
        setTime(time => {
          const newTime = time + 1;
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

  const lockOrientation = () => {
    // Try to lock orientation to landscape
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {
        // Orientation lock not supported or failed - try alternative
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

  const initializeGame = () => {
    const icons = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍑', '🍒', '🥝', 
                   '🍉', '🍐', '🥭', '🍍', '🥥', '🥑', '🍅', '🥕',
                   '🌽', '🥒', '🥬', '🥦', '🧄', '🧅', '🥔', '🍠',
                   '🥐', '🥨', '🧀', '🥚', '🍳', '🥞', '🥓', '🍖',
                   '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑',
                   '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵'];
    
    const selectedIcons = icons.slice(0, config.pairs);
    const pairs = [...selectedIcons, ...selectedIcons];
    
    // Shuffle
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    
    // Create grid
    const newGrid = [];
    for (let i = 0; i < config.size * config.size; i++) {
      newGrid.push({
        id: i,
        icon: pairs[i],
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

      if (firstCard.icon === secondCard.icon) {
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
    const scores = await getHighScores('Memory Grid Icons', difficulty);
    setHighScores(scores);
    
    if (scores.length > 0) {
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
    const score = Math.max(0, 10000 - (time * 10) - (moves * 50));
    const success = await saveScore('Memory Grid Icons', difficulty, score, playerName, time, moves);
    if (success) {
      setShowNameInput(false);
      await loadHighScores();
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
    <div className="memory-grid-icons-game">
      <button className="back-button" onClick={onBack}>← Back to Menu</button>
      
      <div className="memory-icons-container">
        <div className="memory-icons-header">
          <h1>Memory Grid Icons - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</h1>
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
          className="memory-icons-grid" 
          style={{ 
            gridTemplateColumns: `repeat(${config.size}, 1fr)`,
            maxWidth: `${config.size * 100}px`
          }}
        >
          {grid.map(card => (
            <div
              key={card.id}
              className={`memory-icon-card ${card.flipped ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
              onClick={() => handleCardClick(card)}
            >
              <div className="icon-card-front">?</div>
              <div className="icon-card-back">{card.icon}</div>
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

export default MemoryGridIcons;

