import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddProduct from './pages/AddProduct';
import Products from './pages/Products';
import Settings from './pages/Settings';
import Requests from './pages/Requests';
import UserDashboard from './pages/UserDashboard';
import NewRequest from './pages/NewRequest';
import MyRequests from './pages/MyRequests';

const PrivateRoute: React.FC<{ children: React.ReactNode; allowedRole?: string }> = ({
  children,
  allowedRole,
}) => {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && currentUser.role !== allowedRole) {
    return <Navigate to={currentUser.role === 'manager' ? '/dashboard' : '/user-dashboard'} replace />;
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
            <Navigate to={currentUser.role === 'manager' ? '/dashboard' : '/user-dashboard'} replace />
          ) : (
            <Login />
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

        {/* User routes */}
        <Route
          path="/user-dashboard"
          element={
            <PrivateRoute allowedRole="user">
              <UserDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/new-request"
          element={
            <PrivateRoute allowedRole="user">
              <NewRequest />
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
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;
