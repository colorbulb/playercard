import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, CardBody, CardTitle, CardText, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { saveScore, getHighScores } from '../../firebase/scores';
import LandscapeOverlay from '../LandscapeOverlay';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNewGame();
    loadHighScores();
  }, []);

  useEffect(() => {
    if (field.length > 0) {
      loadNewGame();
      loadHighScores();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

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
      const response = await fetch(`${API_BASE}/takuzu/generator?size=${size}&fill=${fill}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.task || !data.field) {
        throw new Error('Invalid response from API');
      }
      setField(data.task.map(row => [...row]));
      setSolution(data.field);
      setGameStatus('playing');
      setTime(0);
      setSelectedCell(null);
      setLoading(false);
    } catch (error) {
      console.error('Error loading Takuzu:', error);
      setError(`Failed to load game: ${error.message}. Please check your connection and try again.`);
      setLoading(false);
      // Initialize with empty field to prevent blank screen
      setField(Array(size).fill(null).map(() => Array(size).fill('x')));
      setSolution(Array(size).fill(null).map(() => Array(size).fill('0')));
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

  const loadHighScores = async () => {
    const scores = await getHighScores('Takuzu', `${size}x${size}`);
    setHighScores(scores);
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
    <>
      <LandscapeOverlay />
      <Container fluid className="takuzu-game">
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
                <CardTitle tag="h1">Takuzu (Binairo)</CardTitle>
              </Col>
              <Col md={6} className="text-md-end">
                <div className="d-flex gap-2 justify-content-md-end justify-content-start flex-wrap">
                  <select 
                    value={size} 
                    onChange={(e) => setSize(Number(e.target.value))}
                    className="form-select"
                    style={{ maxWidth: '150px' }}
                  >
                    <option value={4}>4x4</option>
                    <option value={6}>6x6</option>
                    <option value={8}>8x8</option>
                    <option value={10}>10x10</option>
                    <option value={12}>12x12</option>
                  </select>
                  <Button color="primary" onClick={loadNewGame}>New Game</Button>
                </div>
              </Col>
            </Row>

            <Modal isOpen={showRules} toggle={() => setShowRules(false)}>
              <ModalHeader toggle={() => setShowRules(false)}>Takuzu Rules</ModalHeader>
              <ModalBody>
                <p>Fill the grid with 0s and 1s following these rules:</p>
                <ul>
                  <li>Each row and column must be unique</li>
                  <li>Each row and column must have an equal number of 0s and 1s</li>
                  <li>No more than two of the same digit in a row (e.g., 111 is wrong, 110 is okay)</li>
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

            {!loading && field.length > 0 && (
              <Row className="justify-content-center mb-4">
                <Col xs="auto">
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
                </Col>
              </Row>
            )}

            {!loading && (
              <Row className="justify-content-center mb-4">
                <Col md={6}>
                  <div className="d-flex gap-2 justify-content-center">
                    <Button color="primary" size="lg" onClick={() => handleValueInput('0')}>0</Button>
                    <Button color="primary" size="lg" onClick={() => handleValueInput('1')}>1</Button>
                    <Button color="danger" size="lg" onClick={() => handleValueInput('x')}>Clear</Button>
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
                    <p className="text-muted">No scores yet</p>
                  )}
                </div>
              </CardBody>
            </Card>
          </CardBody>
        </Card>
      </Container>
    </Container>
    </>
  );
}

export default Takuzu;

