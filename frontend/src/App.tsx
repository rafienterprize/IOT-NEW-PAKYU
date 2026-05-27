import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ESP1 from './pages/ESP1';
import ESP2 from './pages/ESP2';
import ESP3 from './pages/ESP3';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="esp1" element={<ESP1 />} />
          <Route path="esp2" element={<ESP2 />} />
          <Route path="esp3" element={<ESP3 />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
