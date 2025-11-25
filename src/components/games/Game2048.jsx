import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, CardBody, CardTitle, CardText, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { saveScore, getHighScores } from '../../firebase/scores';
import LandscapeOverlay from '../LandscapeOverlay';
import './Game2048.css';

const GRID_SIZE = 4;
const WINNING_VALUE = 2048;

function Game2048({ onBack }) {
  const [grid, setGrid] = useState([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won, lost
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [highScores, setHighScores] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  useEffect(() => {
    initializeGame();
    loadHighScores();
    // Load best score from localStorage
    const savedBest = localStorage.getItem('2048-best-score');
    if (savedBest) {
      setBestScore(parseInt(savedBest, 10));
    }
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameStatus !== 'playing') return;
      
      switch(e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handleMove('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleMove('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleMove('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleMove('right');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, gameStatus]);

  const initializeGame = () => {
    const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameStatus('playing');
    setHasWon(false);
    setShowNameInput(false);
  };

  const loadHighScores = async () => {
    try {
      const scores = await getHighScores('2048');
      setHighScores(scores.slice(0, 10));
    } catch (error) {
      console.error('Error loading high scores:', error);
    }
  };

  const addRandomTile = (currentGrid) => {
    const emptyCells = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentGrid[i][j] === 0) {
          emptyCells.push({ row: i, col: j });
        }
      }
    }

    if (emptyCells.length > 0) {
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      currentGrid[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
    }
  };

  const moveLeft = (currentGrid) => {
    let moved = false;
    let newScore = 0;
    const newGrid = currentGrid.map(row => {
      // Remove zeros
      const filtered = row.filter(cell => cell !== 0);
      
      // Merge adjacent equal numbers
      for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i + 1]) {
          filtered[i] *= 2;
          newScore += filtered[i];
          filtered[i + 1] = 0;
        }
      }
      
      // Remove zeros again after merging
      const merged = filtered.filter(cell => cell !== 0);
      
      // Pad with zeros
      while (merged.length < GRID_SIZE) {
        merged.push(0);
      }
      
      // Check if this row changed
      if (JSON.stringify(row) !== JSON.stringify(merged)) {
        moved = true;
      }
      
      return merged;
    });
    
    return { grid: newGrid, moved, score: newScore };
  };

  const moveRight = (currentGrid) => {
    const reversed = currentGrid.map(row => [...row].reverse());
    const { grid, moved, score } = moveLeft(reversed);
    return { grid: grid.map(row => row.reverse()), moved, score };
  };

  const moveUp = (currentGrid) => {
    // Transpose, move left, transpose back
    const transposed = transpose(currentGrid);
    const { grid, moved, score } = moveLeft(transposed);
    return { grid: transpose(grid), moved, score };
  };

  const moveDown = (currentGrid) => {
    // Transpose, move right, transpose back
    const transposed = transpose(currentGrid);
    const { grid, moved, score } = moveRight(transposed);
    return { grid: transpose(grid), moved, score };
  };

  const transpose = (matrix) => {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  };

  const handleMove = (direction) => {
    if (gameStatus !== 'playing') return;

    let result;
    switch(direction) {
      case 'left':
        result = moveLeft(grid);
        break;
      case 'right':
        result = moveRight(grid);
        break;
      case 'up':
        result = moveUp(grid);
        break;
      case 'down':
        result = moveDown(grid);
        break;
      default:
        return;
    }

    if (result.moved) {
      const newGrid = result.grid.map(row => [...row]);
      
      // Check if player has won (reached 2048) in the result grid
      let wonThisMove = false;
      if (gameStatus === 'playing') {
        for (let i = 0; i < GRID_SIZE; i++) {
          for (let j = 0; j < GRID_SIZE; j++) {
            if (result.grid[i][j] === WINNING_VALUE) {
              wonThisMove = true;
              break;
            }
          }
          if (wonThisMove) break;
        }
      }
      
      addRandomTile(newGrid);
      setGrid(newGrid);
      
      if (wonThisMove) {
        setHasWon(true);
        setGameStatus('won');
        setShowNameInput(true);
      }
      
      setScore(prevScore => {
        const newScore = prevScore + result.score;
        // Update best score
        if (newScore > bestScore) {
          setBestScore(newScore);
          localStorage.setItem('2048-best-score', newScore.toString());
        }
        return newScore;
      });
      
      // Check if game is over (only if not already won)
      if (!wonThisMove && isGameOver(newGrid)) {
        setGameStatus('lost');
        setShowNameInput(true);
      }
    }
  };

  const isGameOver = (currentGrid) => {
    // Check for empty cells
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentGrid[i][j] === 0) {
          return false;
        }
      }
    }

    // Check for possible merges
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const current = currentGrid[i][j];
        // Check right
        if (j < GRID_SIZE - 1 && currentGrid[i][j + 1] === current) {
          return false;
        }
        // Check down
        if (i < GRID_SIZE - 1 && currentGrid[i + 1][j] === current) {
          return false;
        }
      }
    }

    return true;
  };

  const handleSaveScore = async () => {
    if (!playerName.trim()) return;
    
    try {
      await saveScore('2048', 'N/A', score, playerName);
      setShowNameInput(false);
      setPlayerName('');
      loadHighScores();
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  const getTileColor = (value) => {
    const colors = {
      0: '#cdc1b4',
      2: '#eee4da',
      4: '#ede0c8',
      8: '#f2b179',
      16: '#f59563',
      32: '#f67c5f',
      64: '#f65e3b',
      128: '#edcf72',
      256: '#edcc61',
      512: '#edc850',
      1024: '#edc53f',
      2048: '#edc22e',
    };
    return colors[value] || '#3c3a32';
  };

  const getTileTextColor = (value) => {
    return value <= 4 ? '#776e65' : '#f9f6f2';
  };

  // Touch/swipe handlers
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipeGesture();
    };

    const handleSwipeGesture = () => {
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const minSwipeDistance = 30;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0) {
            handleMove('right');
          } else {
            handleMove('left');
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0) {
            handleMove('down');
          } else {
            handleMove('up');
          }
        }
      }
    };

    const gameContainer = document.querySelector('.game-2048-container');
    if (gameContainer) {
      gameContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
      gameContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      if (gameContainer) {
        gameContainer.removeEventListener('touchstart', handleTouchStart);
        gameContainer.removeEventListener('touchend', handleTouchEnd);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, gameStatus]);

  return (
    <>
      <LandscapeOverlay />
      <Container fluid className="game-2048">
        <Row className="mb-2">
          <Col>
            <Button color="secondary" size="sm" onClick={onBack}>← Back</Button>
            <Button color="info" size="sm" onClick={() => setShowRules(true)} className="ms-2">?</Button>
          </Col>
        </Row>
        
        <Container className="px-2">
          <Card>
            <CardBody className="p-3">
              <Row className="align-items-center mb-2">
                <Col xs={4}>
                  <CardTitle tag="h1" className="mb-0" style={{ fontSize: '1.5rem' }}>2048</CardTitle>
                </Col>
                <Col xs={4}>
                  <div className="score-container">
                    <div className="score-label">Score</div>
                    <div className="score-value">{score}</div>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="score-container">
                    <div className="score-label">Best</div>
                    <div className="score-value">{bestScore}</div>
                  </div>
                </Col>
              </Row>
              
              <Row className="mb-2">
                <Col>
                  <Button color="primary" size="sm" onClick={initializeGame} className="w-100">New Game</Button>
                </Col>
              </Row>

              {(gameStatus === 'won' || gameStatus === 'lost') && showNameInput && (
                <Card className="mb-2 bg-light">
                  <CardBody className="text-center p-2">
                    <CardTitle tag="h5" className="mb-2">
                      {gameStatus === 'won' ? '🎉 You reached 2048! 🎉' : 'Game Over!'}
                    </CardTitle>
                    <div className="d-flex gap-2 justify-content-center flex-wrap">
                      <Input
                        type="text"
                        placeholder="Enter your name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        style={{ maxWidth: '150px' }}
                        size="sm"
                      />
                      <Button color="success" size="sm" onClick={handleSaveScore}>Save</Button>
                    </div>
                  </CardBody>
                </Card>
              )}

              <div className="game-2048-container">
                <div className="grid-container">
                  {grid.map((row, rowIndex) => (
                    <div key={rowIndex} className="grid-row">
                      {row.map((cell, colIndex) => (
                        <div key={`${rowIndex}-${colIndex}`} className="grid-cell">
                          {cell !== 0 && (
                            <div
                              className="tile"
                              style={{
                                backgroundColor: getTileColor(cell),
                                color: getTileTextColor(cell)
                              }}
                            >
                              {cell}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {gameStatus === 'lost' && (
                <div className="text-center mt-2 mb-2">
                  <CardText className="text-danger mb-0" style={{ fontSize: '0.9rem' }}>No more moves available!</CardText>
                </div>
              )}

              <Row className="mt-2">
                <Col>
                  <div className="d-flex gap-2 justify-content-center">
                    <Button color="outline-primary" size="sm" onClick={() => handleMove('up')}>↑</Button>
                    <Button color="outline-secondary" size="sm" onClick={() => handleMove('left')}>←</Button>
                    <Button color="outline-secondary" size="sm" onClick={() => handleMove('right')}>→</Button>
                    <Button color="outline-primary" size="sm" onClick={() => handleMove('down')}>↓</Button>
                  </div>
                </Col>
              </Row>

            </CardBody>
          </Card>
        </Container>
      </Container>

      <Modal isOpen={showRules} toggle={() => setShowRules(false)}>
        <ModalHeader toggle={() => setShowRules(false)}>2048 Game Rules</ModalHeader>
        <ModalBody>
          <CardText>
            <strong>How to Play:</strong>
          </CardText>
          <ul>
            <li>Use arrow keys or swipe gestures to move all tiles in the grid.</li>
            <li>When two tiles with the same number touch, they merge into one tile with double the value.</li>
            <li>After each move, a new tile (value 2 or 4) appears in a random empty cell.</li>
            <li>Your goal is to create a tile with the value 2048.</li>
            <li>The game ends when there are no more moves available (no empty cells and no possible merges).</li>
            <li>Try to achieve the highest score possible!</li>
          </ul>
          <CardText className="mt-3">
            <strong>Tips:</strong>
          </CardText>
          <ul>
            <li>Try to keep your highest value tile in a corner.</li>
            <li>Don't scatter tiles randomly - think about your moves.</li>
            <li>Plan ahead to avoid getting stuck.</li>
          </ul>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={() => setShowRules(false)}>Got it!</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

export default Game2048;

