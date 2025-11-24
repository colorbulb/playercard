import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, CardBody, CardTitle, CardText, Input } from 'reactstrap';
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
    <Container fluid className="memory-grid-icons-game">
      <Row className="mb-3">
        <Col>
          <Button color="secondary" onClick={onBack}>← Back to Menu</Button>
        </Col>
      </Row>
      
      <Container>
        <Card>
          <CardBody>
            <Row className="align-items-center mb-3">
              <Col md={6}>
                <CardTitle tag="h1">Memory Grid Icons - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</CardTitle>
              </Col>
              <Col md={6} className="text-md-end">
                <Button color="primary" onClick={initializeGame}>New Game</Button>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={3} className="text-center mb-2">
                <div className="p-3 bg-light rounded">
                  <div className="fw-bold text-muted">Time</div>
                  <div className="fs-4 text-primary">{formatTime(time)}</div>
                </div>
              </Col>
              <Col md={3} className="text-center mb-2">
                <div className="p-3 bg-light rounded">
                  <div className="fw-bold text-muted">Moves</div>
                  <div className="fs-4 text-primary">{moves}</div>
                </div>
              </Col>
              <Col md={3} className="text-center mb-2">
                <div className="p-3 bg-light rounded">
                  <div className="fw-bold text-muted">Pairs Found</div>
                  <div className="fs-4 text-primary">{matchedPairs.length / 2} / {config.pairs}</div>
                </div>
              </Col>
              {highestScore && highestScore.time && (
                <Col md={3} className="text-center mb-2">
                  <div className="p-3 bg-light rounded">
                    <div className="fw-bold text-muted">Best Time</div>
                    <div className="fs-4 text-primary">{formatTime(highestScore.time)}</div>
                  </div>
                </Col>
              )}
            </Row>
            
            {timeRemaining !== null && highestScore && highestScore.time && gameStatus === 'playing' && (
              <Card className="mb-3">
                <CardBody>
                  <CardText className="text-center mb-2">Time to beat record:</CardText>
                  <div className="progress mb-2" style={{ height: '20px' }}>
                    <div 
                      className="progress-bar" 
                      role="progressbar"
                      style={{ 
                        width: `${Math.max(0, Math.min(100, (timeRemaining / highestScore.time) * 100))}%`,
                        backgroundColor: timeRemaining > highestScore.time * 0.5 ? '#28a745' : timeRemaining > highestScore.time * 0.25 ? '#ffc107' : '#dc3545'
                      }}
                    />
                  </div>
                  <div className="text-center fw-bold text-primary">
                    {timeRemaining > 0 ? formatTime(timeRemaining) : '0:00 (Record beaten!)'}
                  </div>
                </CardBody>
              </Card>
            )}
            
            {timeRemaining !== null && timeRemaining === 0 && time > highestScore.time && gameStatus === 'playing' && (
              <Card className="mb-3 bg-success text-white">
                <CardBody className="text-center">
                  <CardText className="mb-0 fs-5">🎉 You beat the record! Keep going!</CardText>
                </CardBody>
              </Card>
            )}

            {gameStatus === 'won' && showNameInput && (
              <Card className="mb-3 bg-light">
                <CardBody className="text-center">
                  <CardTitle tag="h2">Congratulations! You completed the game!</CardTitle>
                  <CardText>Time: {formatTime(time)} | Moves: {moves}</CardText>
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

            <Row className="justify-content-center mb-4">
              <Col xs="auto">
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
              </Col>
            </Row>

            <Card>
              <CardBody>
                <CardTitle tag="h5">High Scores - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</CardTitle>
                <div className="scores-list">
                  {highScores.length > 0 ? (
                    highScores.map((score, index) => (
                      <div key={score.id} className="score-item d-flex justify-content-between align-items-center p-2 mb-2 bg-light rounded">
                        <span className="fw-bold text-primary">#{index + 1}</span>
                        <span className="flex-grow-1 ms-3">{score.playerName}</span>
                        <span className="fw-bold">{score.score}</span>
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

export default MemoryGridIcons;

