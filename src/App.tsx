import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContextSupabase';
import { NotificationProvider } from './components/NotificationSystem';
import Login from './components/Login';
import BadgeLogin from './components/BadgeLogin';
import Register from './components/Register';
import Layout from './components/Layout';

// Lazy loading des pages pour optimiser le temps de chargement initial
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AddProduct = lazy(() => import('./pages/AddProduct'));
const Products = lazy(() => import('./pages/Products'));
const Settings = lazy(() => import('./pages/Settings'));
const Requests = lazy(() => import('./pages/Requests'));
const Orders = lazy(() => import('./pages/Orders'));
const Statistics = lazy(() => import('./pages/Statistics'));
const UserCatalog = lazy(() => import('./pages/UserCatalog'));
const UserStatistics = lazy(() => import('./pages/UserStatistics'));
const History = lazy(() => import('./pages/History'));
const Inventory = lazy(() => import('./pages/Inventory'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const LabelGenerator = lazy(() => import('./pages/LabelGenerator'));

// Composant de chargement
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    flexDirection: 'column',
    gap: '1.5rem'
  }}>
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
      <circle cx="12" cy="12" r="10" opacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
    </svg>
    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
      Chargement...
    </p>
  </div>
);

const PrivateRoute: React.FC<{ children: React.ReactNode; allowedRole?: string }> = ({
  children,
  allowedRole,
}) => {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && currentUser.role !== allowedRole) {
    return <Navigate to={currentUser.role === 'manager' ? '/dashboard' : '/catalog'} replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { currentUser } = useApp();

  return (
    <Routes>
      <Route
        path="/"
        element={
          currentUser ? (
            <Navigate to={currentUser.role === 'manager' ? '/dashboard' : '/catalog'} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/register"
        element={
          currentUser ? (
            <Navigate to={currentUser.role === 'manager' ? '/dashboard' : '/catalog'} replace />
          ) : (
            <Register />
          )
        }
      />
      <Route
        path="/badge-login"
        element={
          currentUser ? (
            <Navigate to={currentUser.role === 'manager' ? '/dashboard' : '/catalog'} replace />
          ) : (
            <BadgeLogin />
          )
        }
      />

      <Route
        element={
          <PrivateRoute>
            <Suspense fallback={<PageLoader />}>
              <Layout />
            </Suspense>
          </PrivateRoute>
        }
      >
        {/* Manager routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute allowedRole="manager">
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/products"
          element={
            <PrivateRoute allowedRole="manager">
              <Products />
            </PrivateRoute>
          }
        />
        <Route
          path="/add-product"
          element={
            <PrivateRoute allowedRole="manager">
              <AddProduct />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute allowedRole="manager">
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <PrivateRoute allowedRole="manager">
              <Requests />
            </PrivateRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <PrivateRoute allowedRole="manager">
              <Orders />
            </PrivateRoute>
          }
        />
        <Route
          path="/history"
          element={
            <PrivateRoute allowedRole="manager">
              <History />
            </PrivateRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <PrivateRoute allowedRole="manager">
              <Statistics />
            </PrivateRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <PrivateRoute allowedRole="manager">
              <Inventory />
            </PrivateRoute>
          }
        />
        <Route
          path="/user-management"
          element={
            <PrivateRoute allowedRole="manager">
              <UserManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/label-generator"
          element={
            <PrivateRoute allowedRole="manager">
              <LabelGenerator />
            </PrivateRoute>
          }
        />

        {/* User routes */}
        <Route
          path="/catalog"
          element={
            <PrivateRoute allowedRole="user">
              <UserCatalog />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-statistics"
          element={
            <PrivateRoute allowedRole="user">
              <UserStatistics />
            </PrivateRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter basename="/GestionDesStocks">
      <AppProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;
