# Twilight Struggle Helper - Frontend

A React-based frontend for the Twilight Struggle Helper application.

## Structure

```
src/
├── components/          # React components
│   ├── CardList.tsx    # Reusable card list component with drag & drop
│   ├── DeckArea.tsx    # Deck display component
│   ├── ConfigModal.tsx # Configuration modal
│   └── ConfigModal.css # Modal styles
├── hooks/              # Custom React hooks
│   ├── usePolling.ts   # Polling logic for backend updates
│   ├── useGameState.ts # Game state management
│   └── useDragAndDrop.ts # Drag and drop logic
├── services/           # API and external services
│   └── api.ts         # Backend API service
├── utils/              # Utility functions
│   └── cardUtils.ts   # Card-related utility functions
├── constants.ts        # Application constants
├── types.ts           # TypeScript type definitions
└── App.tsx            # Main application component
```

## Key Features

- **Real-time Updates**: Polls backend for game state changes
- **Drag & Drop**: Move cards between hands and deck sections
- **Source Tracking**: Cards remember their original location when moved
- **Configuration**: File picker and settings management
- **Responsive Design**: Works on desktop and mobile

## Custom Hooks

### `useGameState`
Manages all game state operations including:
- Fetching game status from backend
- Merging backend data with local changes
- Card movement operations
- Error handling

### `useDragAndDrop`
Handles all drag and drop operations:
- Validates drag sources and destinations
- Manages card movement between lists
- Preserves card source information

### `usePolling`
Provides polling functionality:
- Configurable intervals
- Pause/resume capability
- Error handling

## Constants

All magic strings, numbers, and configuration values are centralized in `constants.ts`:
- Polling intervals
- Drag and drop validation rules
- Card display settings
- CSS class names
- Tooltip messages
- Error messages

## Development

The frontend is built with:
- React 18
- TypeScript
- @hello-pangea/dnd for drag and drop
- CSS modules for styling

To run in development mode:
```bash
npm start
```

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
