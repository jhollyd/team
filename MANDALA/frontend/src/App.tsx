import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import AuthHandler from './components/AuthHandler';

function App() {
  return (
    <>
      <AuthHandler />
      <Router>
        <AppRoutes />
      </Router>
    </>
  );
}

export default App;
