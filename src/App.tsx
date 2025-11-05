import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContextSupabase';
import { NotificationProvider } from './components/NotificationSystem';
import Login from './components/Login';
import Register from './components/Register';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddProduct from './pages/AddProduct';
import Products from './pages/Products';
import Settings from './pages/Settings';
import Requests from './pages/Requests';
import Orders from './pages/Orders';
import Statistics from './pages/Statistics';
import UserCatalog from './pages/UserCatalog';
import MyRequests from './pages/MyRequests';
import History from './pages/History';
import ExitSheet from './pages/ExitSheet';
import Inventory from './pages/Inventory';
import UserManagement from './pages/UserManagement';
import LabelGeneration from './pages/LabelGeneration';

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
        element={
          <PrivateRoute>
            <Layout />
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
          path="/exit-sheet"
          element={
            <PrivateRoute allowedRole="manager">
              <ExitSheet />
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
          path="/label-generation"
          element={
            <PrivateRoute allowedRole="manager">
              <LabelGeneration />
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
          path="/my-requests"
          element={
            <PrivateRoute allowedRole="user">
              <MyRequests />
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
