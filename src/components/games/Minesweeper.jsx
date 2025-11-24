import { useState, useEffect } from 'react';
import { saveScore, getHighScores } from '../../firebase/scores';
import './Minesweeper.css';

function Minesweeper({ onBack }) {
  const [grid, setGrid] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [mines, setMines] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won, lost
  const [time, setTime] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [highScores, setHighScores] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [rows, setRows] = useState(16);
  const [cols, setCols] = useState(16);
  const [mineCount, setMineCount] = useState(40);

  useEffect(() => {
    initializeGame();
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

  const initializeGame = () => {
    const newGrid = Array(rows).fill(null).map(() => Array(cols).fill(0));
    const newRevealed = Array(rows).fill(null).map(() => Array(cols).fill(false));
    const newFlagged = Array(rows).fill(null).map(() => Array(cols).fill(false));
    const newMines = [];
    
    // Place mines randomly
    let placedMines = 0;
    while (placedMines < mineCount) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      if (!newMines.find(m => m.row === row && m.col === col)) {
        newMines.push({ row, col });
        newGrid[row][col] = -1; // -1 represents a mine
        placedMines++;
      }
    }
    
    // Calculate numbers
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (newGrid[row][col] !== -1) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = row + dr;
              const nc = col + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newGrid[nr][nc] === -1) {
                count++;
              }
            }
          }
          newGrid[row][col] = count;
        }
      }
    }
    
    setGrid(newGrid);
    setRevealed(newRevealed);
    setFlagged(newFlagged);
    setMines(newMines);
    setGameStatus('playing');
    setTime(0);
  };

  const revealCell = (row, col) => {
    if (gameStatus !== 'playing' || revealed[row][col] || flagged[row][col]) return;
    
    const newRevealed = revealed.map(r => [...r]);
    
    if (grid[row][col] === -1) {
      // Hit a mine - game over
      newRevealed[row][col] = true;
      setRevealed(newRevealed);
      setGameStatus('lost');
      return;
    }
    
    const reveal = (r, c) => {
      if (r < 0 || r >= rows || c < 0 || c >= cols || newRevealed[r][c] || flagged[r][c]) return;
      
      newRevealed[r][c] = true;
      
      if (grid[r][c] === 0) {
        // Auto-reveal adjacent cells if this is a 0
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            reveal(r + dr, c + dc);
          }
        }
      }
    };
    
    reveal(row, col);
    setRevealed(newRevealed);
    
    // Check if won
    let revealedCount = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (newRevealed[r][c]) revealedCount++;
      }
    }
    
    if (revealedCount === (rows * cols - mineCount)) {
      setGameStatus('won');
      setShowNameInput(true);
    }
  };

  const toggleFlag = (row, col, e) => {
    e.preventDefault();
    if (gameStatus !== 'playing' || revealed[row][col]) return;
    
    const newFlagged = flagged.map(r => [...r]);
    newFlagged[row][col] = !newFlagged[row][col];
    setFlagged(newFlagged);
  };

  const handleSaveScore = async () => {
    if (!playerName.trim()) return;
    const score = Math.max(0, 10000 - (time * 10));
    const success = await saveScore('Minesweeper', `${rows}x${cols}`, score, playerName, time, null);
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

  const loadHighScores = async () => {
    const scores = await getHighScores('Minesweeper');
    setHighScores(scores);
  };

  const getRemainingFlags = () => {
    let flaggedCount = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (flagged[r][c]) flaggedCount++;
      }
    }
    return mineCount - flaggedCount;
  };

  return (
    <div className="minesweeper-game">
      <button className="back-button" onClick={onBack}>← Back to Menu</button>
      <button className="rules-button" onClick={() => setShowRules(true)}>?</button>
      
      <div className="minesweeper-container">
        <div className="minesweeper-header">
          <h1>Minesweeper</h1>
          <div className="header-controls">
            <select 
              value={`${rows}x${cols}`} 
              onChange={(e) => {
                const [r, c] = e.target.value.split('x').map(Number);
                setRows(r);
                setCols(c);
                if (r === 9 && c === 9) setMineCount(10);
                else if (r === 16 && c === 16) setMineCount(40);
                else if (r === 16 && c === 30) setMineCount(99);
              }}
              className="size-select"
            >
              <option value="9x9">Beginner (9x9)</option>
              <option value="16x16">Intermediate (16x16)</option>
              <option value="16x30">Expert (16x30)</option>
            </select>
            <button onClick={initializeGame} className="new-game-btn">New Game</button>
          </div>
        </div>

        {showRules && (
          <div className="rules-modal" onClick={() => setShowRules(false)}>
            <div className="rules-content" onClick={(e) => e.stopPropagation()}>
              <h2>Minesweeper Rules</h2>
              <ul>
                <li>Click on cells to reveal them</li>
                <li>Numbers show how many mines are adjacent</li>
                <li>Right-click (or long-press) to flag suspected mines</li>
                <li>Reveal all non-mine cells to win</li>
                <li>Avoid clicking on mines!</li>
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
          <div className="info-item">
            <span className="info-label">Flags:</span>
            <span className="info-value">{getRemainingFlags()}</span>
          </div>
          {gameStatus === 'lost' && (
            <div className="game-over-message">💥 Game Over!</div>
          )}
          {gameStatus === 'won' && (
            <div className="game-won-message">🎉 You Win!</div>
          )}
        </div>

        {gameStatus === 'won' && showNameInput && (
          <div className="score-modal">
            <h2>Congratulations! You cleared the minefield!</h2>
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

        <div className="minesweeper-grid-container">
          <div 
            className="minesweeper-grid" 
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {grid.map((row, rowIndex) => (
              row.map((cell, colIndex) => {
                const isRevealed = revealed[rowIndex][colIndex];
                const isFlagged = flagged[rowIndex][colIndex];
                const isMine = cell === -1;
                const isGameOver = gameStatus === 'lost' || gameStatus === 'won';
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`minesweeper-cell ${isRevealed ? 'revealed' : ''} ${isFlagged ? 'flagged' : ''} ${isGameOver && isMine ? 'mine' : ''}`}
                    onClick={() => revealCell(rowIndex, colIndex)}
                    onContextMenu={(e) => toggleFlag(rowIndex, colIndex, e)}
                  >
                    {isFlagged && !isRevealed ? '🚩' : 
                     isRevealed && isMine ? '💣' :
                     isRevealed && cell > 0 ? cell : 
                     isRevealed ? '' : ''}
                  </div>
                );
              })
            ))}
          </div>
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

export default Minesweeper;

