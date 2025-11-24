import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, CardBody, CardTitle, CardText, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { saveScore, getHighScores } from '../../firebase/scores';
import './Sudoku.css';

const API_BASE = 'https://shadify.yurace.pro/api';

function Sudoku({ onBack }) {
  const [grid, setGrid] = useState([]);
  const [solution, setSolution] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [time, setTime] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [highScores, setHighScores] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [difficulty, setDifficulty] = useState(30); // fill percentage

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
      const response = await fetch(`${API_BASE}/sudoku/generator?fill=${difficulty}`);
      const data = await response.json();
      setGrid(data.task.map(row => [...row]));
      setSolution(data.grid);
      setGameStatus('playing');
      setTime(0);
      setSelectedCell(null);
    } catch (error) {
      console.error('Error loading Sudoku:', error);
      alert('Failed to load new game. Please try again.');
    }
  };

  const handleCellClick = (row, col) => {
    if (gameStatus !== 'playing') return;
    // Only allow editing cells that were empty (0) in the original puzzle
    if (grid[row][col] === 0 || grid[row][col] !== solution[row][col]) {
      setSelectedCell({ row, col });
    }
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || gameStatus !== 'playing') return;
    
    const { row, col } = selectedCell;
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = num === 0 ? 0 : num;
    setGrid(newGrid);
    
    // Check if puzzle is solved
    checkSolution(newGrid);
  };

  const checkSolution = async (currentGrid) => {
    try {
      // Convert grid to string format for API
      const taskString = currentGrid.map(row => row.join('')).join('-');
      const response = await fetch(`${API_BASE}/sudoku/verifier?task=${taskString}`);
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
    // Score based on time (lower is better, so we invert)
    const score = Math.max(0, 10000 - (time * 10));
    const success = await saveScore('Sudoku', difficulty.toString(), score, playerName, time, null);
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
    // Check if this cell was part of the original puzzle
    return grid[row] && grid[row][col] !== 0 && grid[row][col] === solution[row][col];
  };

  const isCorrect = (row, col) => {
    return grid[row][col] === solution[row][col];
  };

  return (
    <Container fluid className="sudoku-game">
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
                <CardTitle tag="h1">Sudoku</CardTitle>
              </Col>
              <Col md={6} className="text-md-end">
                <div className="d-flex gap-2 justify-content-md-end justify-content-start flex-wrap">
                  <select 
                    value={difficulty} 
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="form-select"
                    style={{ maxWidth: '200px' }}
                  >
                    <option value={20}>Easy (20% filled)</option>
                    <option value={30}>Medium (30% filled)</option>
                    <option value={40}>Hard (40% filled)</option>
                  </select>
                  <Button color="primary" onClick={loadNewGame}>New Game</Button>
                </div>
              </Col>
            </Row>

            <Modal isOpen={showRules} toggle={() => setShowRules(false)}>
              <ModalHeader toggle={() => setShowRules(false)}>Sudoku Rules</ModalHeader>
              <ModalBody>
                <p>Fill the grid with numbers from 1 to 9 so that:</p>
                <ul>
                  <li>Each row contains each number exactly once</li>
                  <li>Each column contains each number exactly once</li>
                  <li>Each 3×3 box contains each number exactly once</li>
                </ul>
              </ModalBody>
              <ModalFooter>
                <Button color="secondary" onClick={() => setShowRules(false)}>Close</Button>
              </ModalFooter>
            </Modal>

            <Row className="mb-3">
              <Col className="text-center">
                <div className="d-inline-block p-3 bg-light rounded">
                  <div className="fw-bold text-muted">Time</div>
                  <div className="fs-4 text-primary">{formatTime(time)}</div>
                </div>
              </Col>
            </Row>

            {gameStatus === 'won' && showNameInput && (
              <Card className="mb-3 bg-light">
                <CardBody className="text-center">
                  <CardTitle tag="h2">Congratulations! Puzzle Solved!</CardTitle>
                  <CardText>Time: {formatTime(time)}</CardText>
                  <div className="d-flex gap-2 justify-content-center flex-wrap">
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

            <Row className="justify-content-center mb-4">
              <Col xs="auto">
                <div className="sudoku-grid">
                  {grid.map((row, rowIndex) => (
                    <div key={rowIndex} className="sudoku-row">
                      {row.map((cell, colIndex) => {
                        const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                        const isOriginal = isOriginalCell(rowIndex, colIndex);
                        const isWrong = !isOriginal && grid[rowIndex][colIndex] !== 0 && !isCorrect(rowIndex, colIndex);
                        
                        return (
                          <div
                            key={colIndex}
                            className={`sudoku-cell ${isSelected ? 'selected' : ''} ${isOriginal ? 'original' : ''} ${isWrong ? 'wrong' : ''} ${(rowIndex + 1) % 3 === 0 && rowIndex < 8 ? 'border-bottom' : ''} ${(colIndex + 1) % 3 === 0 && colIndex < 8 ? 'border-right' : ''}`}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                          >
                            {cell !== 0 ? cell : ''}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </Col>
            </Row>

            <Row className="justify-content-center mb-4">
              <Col md={8}>
                <div className="number-pad">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <Button
                      key={num}
                      color="primary"
                      className="number-btn"
                      onClick={() => handleNumberInput(num)}
                    >
                      {num}
                    </Button>
                  ))}
                  <Button color="danger" className="number-btn clear-btn" onClick={() => handleNumberInput(0)}>
                    Clear
                  </Button>
                </div>
              </Col>
            </Row>

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
                    <p className="text-muted">No scores yet</p>
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

export default Sudoku;

