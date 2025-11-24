import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, CardBody, CardTitle, CardText, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { saveScore, getHighScores } from '../../firebase/scores';
import './Minesweeper.css';

const API_BASE = 'https://shadify.yurace.pro/api';

function Minesweeper({ onBack }) {
  const [grid, setGrid] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won, lost
  const [time, setTime] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [highScores, setHighScores] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [rows, setRows] = useState(9);
  const [cols, setCols] = useState(9);
  const [mineCount, setMineCount] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNewGame();
    loadHighScores();
  }, []);

  useEffect(() => {
    if (grid.length > 0) {
      loadNewGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cols, mineCount]);

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
    setLoading(true);
    setError(null);
    try {
      // Choose a random starting position (1-indexed for API)
      const startX = Math.floor(Math.random() * cols) + 1;
      const startY = Math.floor(Math.random() * rows) + 1;
      
      const url = `${API_BASE}/minesweeper/generator?start=${startX}-${startY}&width=${cols}&height=${rows}&mines=${mineCount}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.board || !Array.isArray(data.board)) {
        throw new Error('Invalid response from API');
      }
      
      // Convert API format to internal format
      // API uses: "o" = empty, "x" = mine, numbers = adjacent mine count
      // Internal uses: -1 = mine, 0-8 = adjacent mine count
      const newGrid = data.board.map(row => 
        row.map(cell => {
          if (cell === 'x') return -1; // Mine
          if (cell === 'o') return 0; // Empty (no adjacent mines)
          return parseInt(cell); // Number of adjacent mines
        })
      );
      
      const newRevealed = Array(rows).fill(null).map(() => Array(cols).fill(false));
      const newFlagged = Array(rows).fill(null).map(() => Array(cols).fill(false));
      
      // Reveal starting position (convert from 1-indexed to 0-indexed)
      const [startXCoord, startYCoord] = data.start.split('-').map(Number);
      const startRow = startYCoord - 1;
      const startCol = startXCoord - 1;
      
      // Reveal starting cell and adjacent empty cells
      const revealStart = (r, c) => {
        if (r < 0 || r >= rows || c < 0 || c >= cols || newRevealed[r][c]) return;
        newRevealed[r][c] = true;
        if (newGrid[r][c] === 0) {
          // Auto-reveal adjacent cells if this is empty
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              revealStart(r + dr, c + dc);
            }
          }
        }
      };
      
      revealStart(startRow, startCol);
      
      setGrid(newGrid);
      setRevealed(newRevealed);
      setFlagged(newFlagged);
      setGameStatus('playing');
      setTime(0);
      setMineCount(data.mines);
    } catch (err) {
      console.error('Error loading game:', err);
      setError(err.message || 'Failed to load game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const revealCell = (row, col) => {
    if (gameStatus !== 'playing' || loading || !grid || !grid[row] || !revealed || !revealed[row] || !flagged || !flagged[row]) return;
    if (revealed[row][col] || flagged[row][col]) return;
    
    const newRevealed = revealed.map(r => [...r]);
    
    if (grid[row][col] === -1) {
      // Hit a mine - game over
      newRevealed[row][col] = true;
      setRevealed(newRevealed);
      setGameStatus('lost');
      return;
    }
    
    const reveal = (r, c) => {
      if (r < 0 || r >= rows || c < 0 || c >= cols || newRevealed[r][c]) return;
      if (flagged && flagged[r] && flagged[r][c]) return;
      
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
    if (gameStatus !== 'playing' || loading || !revealed || !revealed[row] || !flagged || !flagged[row]) return;
    if (revealed[row][col]) return;
    
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
    if (!flagged || flagged.length === 0 || !flagged[0]) {
      return mineCount;
    }
    let flaggedCount = 0;
    for (let r = 0; r < rows && r < flagged.length; r++) {
      if (!flagged[r]) continue;
      for (let c = 0; c < cols && c < flagged[r].length; c++) {
        if (flagged[r][c]) flaggedCount++;
      }
    }
    return Math.max(0, mineCount - flaggedCount);
  };

  return (
    <Container fluid className="minesweeper-game">
      <Row className="mb-3">
        <Col>
          <Button color="secondary" onClick={onBack}>← Back to Menu</Button>
          <Button color="info" onClick={() => setShowRules(true)} className="ms-2">?</Button>
        </Col>
      </Row>
      
      <Container>
        <Card>
          <CardBody>
            <Row className="align-items-center mb-3">
              <Col md={6}>
                <CardTitle tag="h1">Minesweeper</CardTitle>
              </Col>
              <Col md={6} className="text-md-end">
                <div className="d-flex gap-2 justify-content-md-end justify-content-start flex-wrap">
                  <select 
                    value={`${rows}x${cols}`} 
                    onChange={(e) => {
                      const [r, c] = e.target.value.split('x').map(Number);
                      setRows(r);
                      setCols(c);
                      // Set mine count based on difficulty (max 25% of cells)
                      const maxMines = Math.floor((r * c) * 0.25);
                      if (r === 9 && c === 9) setMineCount(10);
                      else if (r === 16 && c === 16) setMineCount(40);
                      else if (r === 16 && c === 30) setMineCount(99);
                      else setMineCount(Math.min(maxMines, 50));
                    }}
                    className="form-select"
                    style={{ maxWidth: '200px' }}
                    disabled={loading}
                  >
                    <option value="9x9">Beginner (9x9)</option>
                    <option value="16x16">Intermediate (16x16)</option>
                    <option value="16x30">Expert (16x30)</option>
                  </select>
                  <Button color="primary" onClick={loadNewGame} disabled={loading}>
                    {loading ? 'Loading...' : 'New Game'}
                  </Button>
                </div>
              </Col>
            </Row>

            <Modal isOpen={showRules} toggle={() => setShowRules(false)}>
              <ModalHeader toggle={() => setShowRules(false)}>Minesweeper Rules</ModalHeader>
              <ModalBody>
                <ul>
                  <li>Click on cells to reveal them</li>
                  <li>Numbers show how many mines are adjacent</li>
                  <li>Right-click (or long-press) to flag suspected mines</li>
                  <li>Reveal all non-mine cells to win</li>
                  <li>Avoid clicking on mines!</li>
                  <li>The starting position is automatically revealed</li>
                </ul>
              </ModalBody>
              <ModalFooter>
                <Button color="secondary" onClick={() => setShowRules(false)}>Close</Button>
              </ModalFooter>
            </Modal>

            {error && (
              <Card className="mb-3 border-danger">
                <CardBody className="text-center">
                  <CardText className="text-danger">{error}</CardText>
                  <Button color="primary" onClick={loadNewGame}>Retry</Button>
                </CardBody>
              </Card>
            )}

            {loading && (
              <Card className="mb-3">
                <CardBody className="text-center">
                  <CardText>Loading puzzle...</CardText>
                </CardBody>
              </Card>
            )}

            <Row className="mb-3">
              <Col md={4} className="text-center mb-2">
                <div className="p-3 bg-light rounded">
                  <div className="fw-bold text-muted">Time</div>
                  <div className="fs-4 text-primary">{formatTime(time)}</div>
                </div>
              </Col>
              <Col md={4} className="text-center mb-2">
                <div className="p-3 bg-light rounded">
                  <div className="fw-bold text-muted">Flags</div>
                  <div className="fs-4 text-primary">{getRemainingFlags()}</div>
                </div>
              </Col>
              {gameStatus === 'lost' && (
                <Col md={4} className="text-center mb-2">
                  <div className="p-3 bg-danger text-white rounded">
                    <div className="fw-bold">💥 Game Over!</div>
                  </div>
                </Col>
              )}
              {gameStatus === 'won' && (
                <Col md={4} className="text-center mb-2">
                  <div className="p-3 bg-success text-white rounded">
                    <div className="fw-bold">🎉 You Win!</div>
                  </div>
                </Col>
              )}
            </Row>

            {gameStatus === 'won' && showNameInput && (
              <Card className="mb-3 bg-light">
                <CardBody className="text-center">
                  <CardTitle tag="h2">Congratulations! You cleared the minefield!</CardTitle>
                  <CardText>Time: {formatTime(time)}</CardText>
                  <div className="d-flex gap-2 justify-content-center flex-wrap mt-3">
                    <Input
                      type="text"
                      placeholder="Enter your name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      style={{ maxWidth: '200px' }}
                    />
                    <Button color="success" onClick={handleSaveScore}>Save Score</Button>
                  </div>
                </CardBody>
              </Card>
            )}

            {!loading && grid.length > 0 && (
              <Row className="justify-content-center mb-4">
                <Col xs="auto">
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
                </Col>
              </Row>
            )}

            <Card>
              <CardBody>
                <CardTitle tag="h5">High Scores</CardTitle>
                <div className="scores-list">
                  {highScores.length > 0 ? (
                    highScores.map((scoreItem, index) => (
                      <div key={scoreItem.id} className="score-item d-flex justify-content-between align-items-center p-2 mb-2 bg-light rounded">
                        <span className="fw-bold text-primary">#{index + 1}</span>
                        <span className="flex-grow-1 ms-3">{scoreItem.playerName}</span>
                        <span className="fw-bold">{formatTime(scoreItem.time || 0)}</span>
                      </div>
                    ))
                  ) : (
                    <CardText className="text-muted">No scores yet</CardText>
                  )}
                </div>
              </CardBody>
            </Card>
          </CardBody>
        </Card>
      </Container>
    </Container>
  );
}

export default Minesweeper;

