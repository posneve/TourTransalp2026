import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import OverviewPage from './pages/OverviewPage';
import StagePage from './pages/StagePage';
import CookieConsent from './components/CookieConsent/CookieConsent';
import { ConsentProvider } from './context/ConsentContext';
import 'leaflet/dist/leaflet.css';
import './App.css';

function App() {
  return (
    <ConsentProvider>
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          <Header />
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/stage/:id" element={<StagePage />} />
          </Routes>
        </div>
        <CookieConsent />
      </BrowserRouter>
    </ConsentProvider>
  );
}

export default App;
