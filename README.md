# NextElite Game Collection

A React.js game collection featuring Big 2, Black Jack, and Memory Grid games with Firebase score storage.

## Features

- **Big 2**: Classic card game
- **Black Jack**: Beat the dealer card game
- **Memory Grid**: Memory matching game with three difficulty levels (Easy, Medium, Expert)
- **Firebase Integration**: High scores are stored in Firebase Realtime Database

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Deploying to Firebase

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase (if not already done):
```bash
firebase init
```

4. Deploy:
```bash
npm run build
firebase deploy
```

## Project Structure

```
nextelitegame/
├── src/
│   ├── components/
│   │   ├── GameSelection.jsx       # Main game selection page
│   │   └── games/
│   │       ├── Big2.jsx           # Big 2 game
│   │       ├── BlackJack.jsx      # Black Jack game
│   │       └── MemoryGrid.jsx     # Memory Grid game
│   ├── firebase/
│   │   ├── config.js              # Firebase configuration
│   │   └── scores.js              # Score storage functions
│   ├── App.jsx                    # Main app component
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Global styles
├── firebase.json                   # Firebase hosting configuration
├── package.json
└── vite.config.js
```

## Firebase Configuration

The Firebase configuration is set up in `src/firebase/config.js`. The project uses:
- Firebase Realtime Database for score storage
- Firebase Analytics

Make sure your Firebase project has Realtime Database enabled with appropriate security rules.

## Games

### Big 2
- Select cards from your hand
- Play valid card combinations
- Try to get rid of all your cards first

### Black Jack
- Get as close to 21 as possible without going over
- Beat the dealer's hand
- Hit to get another card, Stand to keep your current hand

### Memory Grid
- Match pairs of cards by flipping them over
- Three difficulty levels:
  - **Easy**: 4x4 grid (8 pairs)
  - **Medium**: 6x6 grid (18 pairs)
  - **Expert**: 8x8 grid (32 pairs)
- Score is based on time and number of moves

## License

MIT
