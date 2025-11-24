import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Button, Card, CardBody, CardTitle, CardText, Input, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { saveScore, getHighScores } from '../../firebase/scores';
import LandscapeOverlay from '../LandscapeOverlay';
import './ColorBalls.css';

// Hex colors for balls
const HEX_COLORS = [
  '#FF0000', // Red
  '#FF6B00', // Orange
  '#FFD700', // Gold/Yellow
  '#00FF00', // Green
  '#0000FF', // Blue
  '#8A2BE2', // Blue Violet
  '#FF1493', // Deep Pink
  '#00CED1', // Dark Turquoise
  '#FF4500', // Orange Red
  '#32CD32', // Lime Green
  '#1E90FF', // Dodger Blue
  '#FF69B4', // Hot Pink
  '#FFA500', // Orange
  '#9370DB', // Medium Purple
  '#20B2AA', // Light Sea Green
  '#DC143C', // Crimson
  '#00FA9A', // Medium Spring Green
  '#4169E1', // Royal Blue
  '#FF6347', // Tomato
  '#00BFFF', // Deep Sky Blue
];

// Shapes for balls
const SHAPES = ['●', '■', '▲', '◆', '★', '♦', '♠', '♥', '♣', '☆', '◉', '◼', '◻', '◈', '⬟', '⬢', '⬡', '⭕', '🔺', '🔻'];

const BALL_SIZE = 50;
const DROP_SPEEDS = {
  easy: 3,
  medium: 5,
  hard: 7
};

function ColorBalls({ onBack }) {
  const [targetItems, setTargetItems] = useState([]);
  const [balls, setBalls] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, finished
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [highScores, setHighScores] = useState([]);
  const [difficulty, setDifficulty] = useState('easy');
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const gameAreaRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastBallTimeRef = useRef(0);

  useEffect(() => {
    initializeGame();
    loadHighScores();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  useEffect(() => {
    if (gameStatus === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameStatus('finished');
            setShowNameInput(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStatus, timeLeft]);

  useEffect(() => {
    if (gameStatus === 'playing' && timeLeft > 0) {
      startGameLoop();
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [gameStatus, timeLeft, difficulty]);

  const initializeGame = () => {
    const dropSpeed = DROP_SPEEDS[difficulty];
    
    // Select target items based on difficulty
    let targets = [];
    if (difficulty === 'easy') {
      // Easy: Only colors (3-4 colors)
      const shuffled = [...HEX_COLORS].sort(() => Math.random() - 0.5);
      targets = shuffled.slice(0, Math.floor(Math.random() * 2) + 3).map(color => ({ type: 'color', value: color }));
    } else if (difficulty === 'medium') {
      // Medium: Only shapes (4-5 shapes)
      const shuffled = [...SHAPES].sort(() => Math.random() - 0.5);
      targets = shuffled.slice(0, Math.floor(Math.random() * 2) + 4).map(shape => ({ type: 'shape', value: shape }));
    } else {
      // Hard: Color and shape combinations (5-6 items)
      const colorShuffled = [...HEX_COLORS].sort(() => Math.random() - 0.5);
      const shapeShuffled = [...SHAPES].sort(() => Math.random() - 0.5);
      const colorCount = Math.floor(Math.random() * 2) + 3;
      const shapeCount = Math.floor(Math.random() * 2) + 2;
      
      targets = [
        ...colorShuffled.slice(0, colorCount).map(color => ({ type: 'color', value: color })),
        ...shapeShuffled.slice(0, shapeCount).map(shape => ({ type: 'shape', value: shape }))
      ];
    }
    
    setTargetItems(targets);
    setBalls([]);
    setScore(0);
    setTimeLeft(60);
    setGameStatus('playing');
    lastBallTimeRef.current = Date.now();
  };

  const startGameLoop = () => {
    const dropSpeed = DROP_SPEEDS[difficulty];
    const animate = () => {
      const gameArea = gameAreaRef.current;
      if (!gameArea || gameStatus !== 'playing' || timeLeft <= 0) {
        return;
      }

      const now = Date.now();
      
      // Spawn new ball faster based on difficulty
      const spawnInterval = difficulty === 'easy' ? 800 : difficulty === 'medium' ? 600 : 400;
      if (now - lastBallTimeRef.current > (Math.random() * spawnInterval + spawnInterval)) {
        spawnBall();
        lastBallTimeRef.current = now;
      }

      // Update ball positions with faster speed
      setBalls(prevBalls => {
        const newBalls = prevBalls
          .map(ball => ({
            ...ball,
            y: ball.y + dropSpeed
          }))
          .filter(ball => ball.y < gameArea.clientHeight);

        return newBalls;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const spawnBall = () => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    // Spawn based on difficulty
    let item;
    let type;
    if (difficulty === 'easy') {
      // Easy: Only colors
      item = HEX_COLORS[Math.floor(Math.random() * HEX_COLORS.length)];
      type = 'color';
    } else if (difficulty === 'medium') {
      // Medium: Only shapes
      item = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      type = 'shape';
    } else {
      // Hard: Both colors and shapes
      const useColor = Math.random() > 0.5;
      if (useColor) {
        item = HEX_COLORS[Math.floor(Math.random() * HEX_COLORS.length)];
        type = 'color';
      } else {
        item = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        type = 'shape';
      }
    }
    
    const randomX = Math.random() * (gameArea.clientWidth - BALL_SIZE);

    setBalls(prev => [...prev, {
      id: Date.now() + Math.random(),
      x: randomX,
      y: 0,
      item: item,
      type: type
    }]);
  };

  const handleBallClick = (ball) => {
    if (gameStatus !== 'playing') return;

    // Check if clicked ball matches any target
    const isTarget = targetItems.some(target => 
      target.value === ball.item && target.type === ball.type
    );
    
    if (isTarget) {
      setScore(prev => prev + 1);
      // Remove the ball
      setBalls(prev => prev.filter(b => b.id !== ball.id));
    }
    // If not a target, do nothing (user doesn't need to tap it)
  };

  const loadHighScores = async () => {
    const scores = await getHighScores('Color Balls', difficulty);
    setHighScores(scores);
  };

  const handleSaveScore = async () => {
    if (!playerName.trim()) return;
    const success = await saveScore('Color Balls', difficulty, score, playerName, null, null);
    if (success) {
      setShowNameInput(false);
      await loadHighScores();
    } else {
      alert('Failed to save score. Please check your connection and try again.');
    }
  };

  const handleDifficultySelect = (newDifficulty) => {
    setDifficulty(newDifficulty);
    setShowDifficultyModal(false);
  };

  return (
    <>
      <LandscapeOverlay />
      <Container fluid className="color-balls-game">
      <Row>
        <Col>
          <Button color="secondary" onClick={onBack} className="mb-3">← Back to Menu</Button>
          <Button color="info" onClick={() => setShowDifficultyModal(true)} className="mb-3 ms-2">
            Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Button>
        </Col>
      </Row>
      
      <Container>
        <Card className="mb-4">
          <CardBody>
            <Row className="align-items-center mb-3">
              <Col md={6}>
                <CardTitle tag="h1">Color Balls</CardTitle>
              </Col>
              <Col md={6} className="text-md-end">
                <div className="d-flex gap-3 justify-content-md-end justify-content-start">
                  <div className="text-center">
                    <div className="fw-bold text-primary">Score</div>
                    <div className="fs-4">{score}</div>
                  </div>
                  <div className="text-center">
                    <div className="fw-bold text-primary">Time</div>
                    <div className="fs-4">{timeLeft}s</div>
                  </div>
                  <Button 
                    color="primary" 
                    onClick={initializeGame} 
                    disabled={gameStatus === 'playing'}
                    size="sm"
                  >
                    New Game
                  </Button>
                </div>
              </Col>
            </Row>

            {gameStatus === 'finished' && showNameInput && (
              <Card className="mb-3 bg-light">
                <CardBody className="text-center">
                  <CardTitle tag="h2">Time's Up!</CardTitle>
                  <CardText>Final Score: {score}</CardText>
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

            <Row className="g-3">
              <Col md={2} className="d-none d-md-block">
                <Card className="h-100">
                  <CardBody>
                    <CardTitle tag="h5">Tap These:</CardTitle>
                    <div className="target-items-list">
                    {targetItems.map((item, index) => (
                      <div key={index} className="target-item-display mb-2">
                        {item.type === 'color' ? (
                          <div 
                            className="target-color-ball" 
                            style={{ backgroundColor: item.value }}
                          />
                        ) : (
                          <span className="fs-3">{item.value}</span>
                        )}
                      </div>
                    ))}
                    </div>
                  </CardBody>
                </Card>
              </Col>
              
              <Col md={8}>
                <div className="game-area-container" ref={gameAreaRef}>
                  <div className="game-area">
                    {balls.map(ball => {
                      const isTarget = targetItems.some(target => 
                        target.value === ball.item && target.type === ball.type
                      );
                      
                      return (
                        <div
                          key={ball.id}
                          className="ball"
                          style={{
                            left: `${ball.x}px`,
                            top: `${ball.y}px`,
                            backgroundColor: ball.type === 'color' ? ball.item : 'transparent'
                          }}
                          onClick={() => handleBallClick(ball)}
                        >
                          {ball.type === 'shape' ? ball.item : ''}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Col>

              <Col md={2} className="d-none d-md-block">
                <Card className="h-100">
                  <CardBody>
                    <CardTitle tag="h5">Tap These:</CardTitle>
                    <div className="target-items-list">
                    {targetItems.map((item, index) => (
                      <div key={index} className="target-item-display mb-2">
                        {item.type === 'color' ? (
                          <div 
                            className="target-color-ball" 
                            style={{ backgroundColor: item.value }}
                          />
                        ) : (
                          <span className="fs-3">{item.value}</span>
                        )}
                      </div>
                    ))}
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>

            {/* Mobile target items */}
            <Row className="d-md-none mt-3">
              <Col>
                <Card>
                  <CardBody>
                    <CardTitle tag="h5" className="text-center">Tap These:</CardTitle>
                    <div className="d-flex justify-content-center flex-wrap gap-2">
                      {targetItems.map((item, index) => (
                        <div key={index} className="target-item-display">
                          {item.type === 'color' ? (
                            <div 
                              className="target-color-ball" 
                              style={{ backgroundColor: item.value }}
                            />
                          ) : (
                            <span className="fs-3">{item.value}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>

            <Card className="mt-4">
              <CardBody>
                <CardTitle tag="h5">High Scores - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</CardTitle>
                <div className="scores-list">
                  {highScores.length > 0 ? (
                    highScores.map((scoreItem, index) => (
                      <div key={scoreItem.id} className="score-item d-flex justify-content-between align-items-center p-2 mb-2 bg-light rounded">
                        <span className="fw-bold text-primary">#{index + 1}</span>
                        <span className="flex-grow-1 ms-3">{scoreItem.playerName}</span>
                        <span className="fw-bold">{scoreItem.score}</span>
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

      <Modal isOpen={showDifficultyModal} toggle={() => setShowDifficultyModal(false)}>
        <ModalHeader toggle={() => setShowDifficultyModal(false)}>Select Difficulty</ModalHeader>
        <ModalBody>
          <div className="d-grid gap-2">
            <Button 
              color={difficulty === 'easy' ? 'success' : 'outline-success'} 
              size="lg"
              onClick={() => handleDifficultySelect('easy')}
            >
              Easy - Colors Only
            </Button>
            <Button 
              color={difficulty === 'medium' ? 'warning' : 'outline-warning'} 
              size="lg"
              onClick={() => handleDifficultySelect('medium')}
            >
              Medium - Shapes Only
            </Button>
            <Button 
              color={difficulty === 'hard' ? 'danger' : 'outline-danger'} 
              size="lg"
              onClick={() => handleDifficultySelect('hard')}
            >
              Hard - Colors & Shapes
            </Button>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setShowDifficultyModal(false)}>Close</Button>
        </ModalFooter>
      </Modal>
    </Container>
    </>
  );
}

export default ColorBalls;
