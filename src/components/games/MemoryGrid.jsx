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

  const difficultyConfig = {
    easy: { size: 4, pairs: 8 },
    medium: { size: 6, pairs: 18 },
    expert: { size: 8, pairs: 32 }
  };

  const config = difficultyConfig[difficulty] || difficultyConfig.easy;

  useEffect(() => {
    initializeGame();
    loadHighScores();
  }, [difficulty]);

  useEffect(() => {
    let interval = null;
    if (gameStatus === 'playing') {
      interval = setInterval(() => {
        setTime(time => time + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus]);

  const initializeGame = () => {
    // Create a standard deck of 52 playing cards
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const fullDeck = [];
    
    for (let suit of suits) {
      for (let rank of ranks) {
        fullDeck.push({ suit, rank, id: `${suit}-${rank}` });
      }
    }
    
    // Select random cards for pairs based on difficulty
    const selectedCards = [];
    const usedIndices = new Set();
    
    while (selectedCards.length < config.pairs) {
      const randomIndex = Math.floor(Math.random() * fullDeck.length);
      if (!usedIndices.has(randomIndex)) {
        selectedCards.push(fullDeck[randomIndex]);
        usedIndices.add(randomIndex);
      }
    }
    
    // Create pairs (each card appears twice)
    const pairs = [...selectedCards, ...selectedCards];
    
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
        card: pairs[i],
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

      if (firstCard.card.suit === secondCard.card.suit && firstCard.card.rank === secondCard.card.rank) {
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
  };

  const handleSaveScore = async () => {
    if (!playerName.trim()) return;
    // Score based on time and moves (lower is better, so we invert)
    const score = Math.max(0, 10000 - (time * 10) - (moves * 50));
    await saveScore('Memory Grid', difficulty, score, playerName);
    setShowNameInput(false);
    loadHighScores();
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
        </div>

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

