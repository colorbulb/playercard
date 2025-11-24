import { useState, useEffect } from 'react';
import { saveScore, getHighScores } from '../../firebase/scores';
import './Set.css';

const API_BASE = 'https://shadify.yurace.pro/api';

function Set({ onBack }) {
  const [layout, setLayout] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing');
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [highScores, setHighScores] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [gameState, setGameState] = useState('');
  const [freeCards, setFreeCards] = useState([]);

  useEffect(() => {
    loadNewGame();
    loadHighScores();
  }, []);

  useEffect(() => {
    let interval = null;
    if (gameStatus === 'playing') {
      interval = setInterval(() => {
        setTime(time => time + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus]);

  const loadNewGame = async () => {
    try {
      const response = await fetch(`${API_BASE}/set/start?possible-sets=true`);
      const data = await response.json();
      setLayout(data.layout);
      setFreeCards(data.freeCards);
      setGameState(data.state);
      setScore(0);
      setTime(0);
      setSelectedCards([]);
      setGameStatus('playing');
    } catch (error) {
      console.error('Error loading Set game:', error);
      alert('Failed to load new game. Please try again.');
    }
  };

  const handleCardClick = (card) => {
    if (gameStatus !== 'playing') return;
    
    const isSelected = selectedCards.find(c => c._id === card._id);
    if (isSelected) {
      setSelectedCards(selectedCards.filter(c => c._id !== card._id));
    } else {
      if (selectedCards.length < 3) {
        setSelectedCards([...selectedCards, card]);
      }
    }
  };

  const checkSet = async () => {
    if (selectedCards.length !== 3) return;
    
    try {
      const cardIds = selectedCards.map(c => c._id).sort((a, b) => a - b).join('-');
      const response = await fetch(`${API_BASE}/set/${gameState}?action=remove&cards=${cardIds}`);
      const data = await response.json();
      
      if (data.state) {
        // Set is valid
        setScore(score + 1);
        setGameState(data.state);
        setLayout(data.layout);
        setFreeCards(data.freeCards);
        setSelectedCards([]);
        
        // Add 3 more cards if available
        if (data.freeCards && data.freeCards.length > 0 && data.layout.length < 20) {
          const addResponse = await fetch(`${API_BASE}/set/${data.state}?action=add`);
          const addData = await addResponse.json();
          if (addData.state) {
            setGameState(addData.state);
            setLayout(addData.layout);
            setFreeCards(addData.freeCards);
          }
        }
        
        // Check if game is won (no more cards)
        if (data.layout.length === 0 && (!data.freeCards || data.freeCards.length === 0)) {
          setGameStatus('won');
          setShowNameInput(true);
        }
      } else {
        // Invalid set
        alert('This is not a valid set! Try again.');
        setSelectedCards([]);
      }
    } catch (error) {
      console.error('Error checking set:', error);
      alert('Invalid set! Try again.');
      setSelectedCards([]);
    }
  };

  const handleSaveScore = async () => {
    if (!playerName.trim()) return;
    const finalScore = score * 100 - time; // Higher score is better
    const success = await saveScore('Set', 'N/A', finalScore, playerName, time, score);
    if (success) {
      setShowNameInput(false);
      await loadHighScores();
    } else {
      alert('Failed to save score. Please check your connection and try again.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCardDisplay = (card) => {
    const shapes = {
      diamond: '♦',
      squiggle: '~',
      oval: '○'
    };
    const colors = {
      red: '#dc3545',
      green: '#28a745',
      purple: '#6f42c1'
    };
    const shading = {
      solid: '■',
      striped: '▦',
      open: '□'
    };
    
    const symbol = shapes[card.shape] || '?';
    const color = colors[card.color] || '#333';
    const fill = shading[card.shading] || '?';
    
    return { symbol, color, fill, number: card.number };
  };

  return (
    <div className="set-game">
      <button className="back-button" onClick={onBack}>← Back to Menu</button>
      <button className="rules-button" onClick={() => setShowRules(true)}>?</button>
      
      <div className="set-container">
        <div className="set-header">
          <h1>Set Card Game</h1>
          <div className="header-controls">
            <div className="game-stats-header">
              <span>Score: {score}</span>
              <span>Time: {formatTime(time)}</span>
            </div>
            <button onClick={loadNewGame} className="new-game-btn">New Game</button>
          </div>
        </div>

        {showRules && (
          <div className="rules-modal" onClick={() => setShowRules(false)}>
            <div className="rules-content" onClick={(e) => e.stopPropagation()}>
              <h2>Set Game Rules</h2>
              <p>Find sets of 3 cards where for each feature, all cards are either:</p>
              <ul>
                <li><strong>All the same</strong> (e.g., all red, all diamonds, all solid)</li>
                <li><strong>All different</strong> (e.g., one red, one green, one purple)</li>
              </ul>
              <p>Features: Number (1, 2, or 3), Shape (diamond, squiggle, oval), Color (red, green, purple), Shading (solid, striped, open)</p>
              <button onClick={() => setShowRules(false)} className="close-rules-btn">Close</button>
            </div>
          </div>
        )}

        {gameStatus === 'won' && showNameInput && (
          <div className="score-modal">
            <h2>Congratulations! Game Complete!</h2>
            <p>Score: {score} sets | Time: {formatTime(time)}</p>
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

        <div className="cards-layout">
          {layout.map((card) => {
            const isSelected = selectedCards.find(c => c._id === card._id);
            const display = getCardDisplay(card);
            return (
              <div
                key={card._id}
                className={`set-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleCardClick(card)}
              >
                <div className="card-content" style={{ color: display.color }}>
                  {Array(display.number).fill(0).map((_, i) => (
                    <span key={i} className="card-symbol">{display.symbol}</span>
                  ))}
                </div>
                <div className="card-info">
                  <small>{display.fill}</small>
                </div>
              </div>
            );
          })}
        </div>

        {selectedCards.length === 3 && (
          <div className="set-actions">
            <button onClick={checkSet} className="check-set-btn">Check Set</button>
            <button onClick={() => setSelectedCards([])} className="clear-selection-btn">Clear Selection</button>
          </div>
        )}

        <div className="high-scores">
          <h3>High Scores</h3>
          <div className="scores-list">
            {highScores.length > 0 ? (
              highScores.map((scoreItem, index) => (
                <div key={scoreItem.id} className="score-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{scoreItem.playerName}</span>
                  <span className="score">{scoreItem.score} ({scoreItem.moves || 0} sets)</span>
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

export default Set;

