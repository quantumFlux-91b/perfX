import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Dashboard from './pages/Dashboard/Dashboard';
import Upload from './pages/Upload/Upload';
import Compare from './pages/Compare/Compare';
import Details from './pages/Details/Details';
import Login from './pages/Login/Login';
import { AuthProvider } from './context/AuthContext';

function AppContent() {
  const location = useLocation();
  const showNav = location.pathname !== '/';

  return (
    <>
      {showNav && <Navbar />}
      
      <main className="container animate-fade-in app-main">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/applications" element={<Dashboard />} />
          <Route path="/applications/:applicationName" element={<Dashboard />} />
          <Route path="/applications/:applicationName/:version/details" element={<Details />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/compare" element={<Compare />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
