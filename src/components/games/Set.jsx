import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, CardBody, CardTitle, CardText, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/set/start?possible-sets=true`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.layout || !data.state) {
        throw new Error('Invalid response from API');
      }
      setLayout(data.layout);
      setFreeCards(data.freeCards || []);
      setGameState(data.state);
      setScore(0);
      setTime(0);
      setSelectedCards([]);
      setGameStatus('playing');
      setLoading(false);
    } catch (error) {
      console.error('Error loading Set game:', error);
      setError(`Failed to load game: ${error.message}. Please check your connection and try again.`);
      setLoading(false);
      // Initialize with empty layout to prevent blank screen
      setLayout([]);
      setFreeCards([]);
      setGameState('');
    }
  };

  const loadHighScores = async () => {
    const scores = await getHighScores('Set');
    setHighScores(scores);
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
    <Container fluid className="set-game">
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
                <CardTitle tag="h1">Set Card Game</CardTitle>
              </Col>
              <Col md={6} className="text-md-end">
                <div className="d-flex gap-3 justify-content-md-end justify-content-start flex-wrap">
                  <div className="text-center">
                    <div className="fw-bold text-primary">Score</div>
                    <div className="fs-4">{score}</div>
                  </div>
                  <div className="text-center">
                    <div className="fw-bold text-primary">Time</div>
                    <div className="fs-4">{formatTime(time)}</div>
                  </div>
                  <Button color="primary" onClick={loadNewGame}>New Game</Button>
                </div>
              </Col>
            </Row>

            <Modal isOpen={showRules} toggle={() => setShowRules(false)}>
              <ModalHeader toggle={() => setShowRules(false)}>Set Game Rules</ModalHeader>
              <ModalBody>
                <p>Find sets of 3 cards where for each feature, all cards are either:</p>
                <ul>
                  <li><strong>All the same</strong> (e.g., all red, all diamonds, all solid)</li>
                  <li><strong>All different</strong> (e.g., one red, one green, one purple)</li>
                </ul>
                <p>Features: Number (1, 2, or 3), Shape (diamond, squiggle, oval), Color (red, green, purple), Shading (solid, striped, open)</p>
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
                  <CardText>Loading game...</CardText>
                </CardBody>
              </Card>
            )}

            {gameStatus === 'won' && showNameInput && (
              <Card className="mb-3 bg-light">
                <CardBody className="text-center">
                  <CardTitle tag="h2">Congratulations! Game Complete!</CardTitle>
                  <CardText>Score: {score} sets | Time: {formatTime(time)}</CardText>
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

            {!loading && layout.length > 0 && (
              <Row className="mb-3">
                <Col>
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
                </Col>
              </Row>
            )}

            {selectedCards.length === 3 && !loading && (
              <Row className="mb-3">
                <Col className="text-center">
                  <div className="d-flex gap-2 justify-content-center">
                    <Button color="success" size="lg" onClick={checkSet}>Check Set</Button>
                    <Button color="danger" size="lg" onClick={() => setSelectedCards([])}>Clear Selection</Button>
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
                        <span className="fw-bold">{scoreItem.score} ({scoreItem.moves || 0} sets)</span>
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

export default Set;

