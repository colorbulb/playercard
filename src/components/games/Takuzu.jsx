import { useState, useEffect } from 'react';
import { saveScore, getHighScores } from '../../firebase/scores';
import './Takuzu.css';

const API_BASE = 'https://shadify.yurace.pro/api';

function Takuzu({ onBack }) {
  const [field, setField] = useState([]);
  const [solution, setSolution] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [time, setTime] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [highScores, setHighScores] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [size, setSize] = useState(8);
  const [fill, setFill] = useState(33);

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
      const response = await fetch(`${API_BASE}/takuzu/generator?size=${size}&fill=${fill}`);
      const data = await response.json();
      setField(data.task.map(row => [...row]));
      setSolution(data.field);
      setGameStatus('playing');
      setTime(0);
      setSelectedCell(null);
    } catch (error) {
      console.error('Error loading Takuzu:', error);
      alert('Failed to load new game. Please try again.');
    }
  };

  const handleCellClick = (row, col) => {
    if (gameStatus !== 'playing') return;
    // Only allow editing cells that are 'x' (empty) in the original puzzle
    if (field[row][col] === 'x') {
      setSelectedCell({ row, col });
    }
  };

  const handleValueInput = (value) => {
    if (!selectedCell || gameStatus !== 'playing') return;
    
    const { row, col } = selectedCell;
    const newField = field.map(r => [...r]);
    newField[row][col] = value;
    setField(newField);
    setSelectedCell(null);
    
    // Check if puzzle is solved
    checkSolution(newField);
  };

  const checkSolution = async (currentField) => {
    try {
      // Convert field to string format for API
      const taskString = currentField.map(row => row.join('')).join('-');
      const response = await fetch(`${API_BASE}/takuzu/verifier?task=${taskString}`);
      const data = await response.json();
      
      if (data.isValid) {
        setGameStatus('won');
        setShowNameInput(true);
      }
    } catch (error) {
      console.error('Error checking solution:', error);
    }
  };

  const handleSaveScore = async () => {
    if (!playerName.trim()) return;
    const score = Math.max(0, 10000 - (time * 10));
    const success = await saveScore('Takuzu', `${size}x${size}`, score, playerName, time, null);
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

  const isOriginalCell = (row, col) => {
    return field[row] && field[row][col] !== 'x';
  };

  return (
    <div className="takuzu-game">
      <button className="back-button" onClick={onBack}>← Back to Menu</button>
      <button className="rules-button" onClick={() => setShowRules(true)}>?</button>
      
      <div className="takuzu-container">
        <div className="takuzu-header">
          <h1>Takuzu (Binairo)</h1>
          <div className="header-controls">
            <select 
              value={size} 
              onChange={(e) => setSize(Number(e.target.value))}
              className="size-select"
            >
              <option value={4}>4x4</option>
              <option value={6}>6x6</option>
              <option value={8}>8x8</option>
              <option value={10}>10x10</option>
              <option value={12}>12x12</option>
            </select>
            <button onClick={loadNewGame} className="new-game-btn">New Game</button>
          </div>
        </div>

        {showRules && (
          <div className="rules-modal" onClick={() => setShowRules(false)}>
            <div className="rules-content" onClick={(e) => e.stopPropagation()}>
              <h2>Takuzu Rules</h2>
              <p>Fill the grid with 0s and 1s following these rules:</p>
              <ul>
                <li>Each row and column must be unique</li>
                <li>Each row and column must have an equal number of 0s and 1s</li>
                <li>No more than two of the same digit in a row (e.g., 111 is wrong, 110 is okay)</li>
              </ul>
              <button onClick={() => setShowRules(false)} className="close-rules-btn">Close</button>
            </div>
          </div>
        )}

        <div className="game-info">
          <div className="info-item">
            <span className="info-label">Time:</span>
            <span className="info-value">{formatTime(time)}</span>
          </div>
        </div>

        {gameStatus === 'won' && showNameInput && (
          <div className="score-modal">
            <h2>Congratulations! Puzzle Solved!</h2>
            <p>Time: {formatTime(time)}</p>
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

        <div className="takuzu-grid-container">
          <div className="takuzu-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
            {field.map((row, rowIndex) => (
              row.map((cell, colIndex) => {
                const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                const isOriginal = isOriginalCell(rowIndex, colIndex);
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`takuzu-cell ${isSelected ? 'selected' : ''} ${isOriginal ? 'original' : ''}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {cell === 'x' ? '' : cell}
                  </div>
                );
              })
            ))}
          </div>
        </div>

        <div className="value-pad">
          <button className="value-btn" onClick={() => handleValueInput('0')}>
            0
          </button>
          <button className="value-btn" onClick={() => handleValueInput('1')}>
            1
          </button>
          <button className="value-btn clear-btn" onClick={() => handleValueInput('x')}>
            Clear
          </button>
        </div>

        <div className="high-scores">
          <h3>High Scores</h3>
          <div className="scores-list">
            {highScores.length > 0 ? (
              highScores.map((scoreItem, index) => (
                <div key={scoreItem.id} className="score-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{scoreItem.playerName}</span>
                  <span className="score">{formatTime(scoreItem.time || 0)}</span>
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

export default Takuzu;

