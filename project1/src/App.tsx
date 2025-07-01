import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import  Loans  from './pages/loans/Loans';
import { Inventory } from './pages/Inventory/Inventory';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';
import MaintenancePage from './pages/dano';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/MaintenancePage" element={<MaintenancePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="loans" element={<Loans />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;