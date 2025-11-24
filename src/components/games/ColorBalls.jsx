import { useState, useEffect, useRef } from 'react';
import { saveScore, getHighScores } from '../../firebase/scores';
import './ColorBalls.css';

const COLORS = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪'];
const BALL_SIZE = 50;
const DROP_SPEED = 2;

function ColorBalls({ onBack }) {
  const [targetColors, setTargetColors] = useState([]);
  const [balls, setBalls] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, finished
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [highScores, setHighScores] = useState([]);
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
  }, []);

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
  }, [gameStatus, timeLeft]);

  const initializeGame = () => {
    // Select 3-4 random target colors
    const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
    setTargetColors(shuffled.slice(0, Math.floor(Math.random() * 2) + 3));
    setBalls([]);
    setScore(0);
    setTimeLeft(60);
    setGameStatus('playing');
    lastBallTimeRef.current = Date.now();
  };

  const startGameLoop = () => {
    const animate = () => {
      const gameArea = gameAreaRef.current;
      if (!gameArea || gameStatus !== 'playing' || timeLeft <= 0) {
        return;
      }

      const now = Date.now();
      
      // Spawn new ball every 1-2 seconds
      if (now - lastBallTimeRef.current > (Math.random() * 1000 + 1000)) {
        spawnBall();
        lastBallTimeRef.current = now;
      }

      // Update ball positions
      setBalls(prevBalls => {
        const newBalls = prevBalls
          .map(ball => ({
            ...ball,
            y: ball.y + DROP_SPEED
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

    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const randomX = Math.random() * (gameArea.clientWidth - BALL_SIZE);

    setBalls(prev => [...prev, {
      id: Date.now() + Math.random(),
      x: randomX,
      y: 0,
      color: randomColor
    }]);
  };

  const handleBallClick = (ball) => {
    if (gameStatus !== 'playing') return;

    // Check if clicked ball is a target color
    if (targetColors.includes(ball.color)) {
      setScore(prev => prev + 1);
      // Remove the ball
      setBalls(prev => prev.filter(b => b.id !== ball.id));
    }
    // If not a target color, do nothing (user doesn't need to tap it)
  };

  const loadHighScores = async () => {
    const scores = await getHighScores('Color Balls');
    setHighScores(scores);
  };

  const handleSaveScore = async () => {
    if (!playerName.trim()) return;
    const success = await saveScore('Color Balls', 'N/A', score, playerName, null, null);
    if (success) {
      setShowNameInput(false);
      await loadHighScores();
    } else {
      alert('Failed to save score. Please check your connection and try again.');
    }
  };

  return (
    <div className="color-balls-game">
      <button className="back-button" onClick={onBack}>← Back to Menu</button>
      
      <div className="color-balls-container">
        <div className="game-header">
          <h1>Color Balls</h1>
          <div className="game-info">
            <div className="info-item">
              <span className="info-label">Score:</span>
              <span className="info-value">{score}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Time:</span>
              <span className="info-value">{timeLeft}s</span>
            </div>
          </div>
          <button onClick={initializeGame} className="new-game-btn" disabled={gameStatus === 'playing'}>
            New Game
          </button>
        </div>

        {gameStatus === 'finished' && showNameInput && (
          <div className="score-modal">
            <h2>Time's Up!</h2>
            <p>Final Score: {score}</p>
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

        <div className="target-colors-section">
          <div className="target-colors-left">
            <h3>Tap These:</h3>
            <div className="target-colors-list">
              {targetColors.map((color, index) => (
                <div key={index} className="target-color-item">{color}</div>
              ))}
            </div>
          </div>
          
          <div className="game-area-container" ref={gameAreaRef}>
            <div className="game-area">
              {balls.map(ball => (
                <div
                  key={ball.id}
                  className={`ball ${targetColors.includes(ball.color) ? 'target' : 'non-target'}`}
                  style={{
                    left: `${ball.x}px`,
                    top: `${ball.y}px`,
                  }}
                  onClick={() => handleBallClick(ball)}
                >
                  {ball.color}
                </div>
              ))}
            </div>
          </div>

          <div className="target-colors-right">
            <h3>Tap These:</h3>
            <div className="target-colors-list">
              {targetColors.map((color, index) => (
                <div key={index} className="target-color-item">{color}</div>
              ))}
            </div>
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
                  <span className="score">{scoreItem.score}</span>
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

export default ColorBalls;

