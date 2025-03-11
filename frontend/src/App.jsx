import React, { useEffect, useState } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { auth } from "../service/fireBaseConfig";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import Suggestions from "./pages/Suggestions";
import ChatSystem from "./pages/ChatSystem";
import Maps from "./pages/Maps";
import LandingPage from "./pages/LandingPage";
import InventoryQRSystem from "./pages/Qr_Code";
import MapsTest from "./pages/MapsTest";
import WarehouseDashboard from "./pages/Warehouse";
import WarehouseTransfer from "./pages/Warehouse_test";

// Private Route wrapper
const PrivateRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

// Wrap components with Layout
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Layout>
        <LandingPage />
      </Layout>
    ),
  },
  {
    path: "/login",
    element: (
      <Layout>
        <Login />
      </Layout>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <Layout>
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      </Layout>
    ),
  },
  {
    path: "/marketplace",
    element: (
      <Layout>
        <PrivateRoute>
          <Marketplace />
        </PrivateRoute>
      </Layout>
    ),
  },
  {
    path: "/suggestions",
    element: (
      <Layout>
        <PrivateRoute>
          <Suggestions />
        </PrivateRoute>
      </Layout>
    ),
  },
  {
    path: "/chat",
    element: (
      <Layout>
        <PrivateRoute>
          <ChatSystem />
        </PrivateRoute>
      </Layout>
    ),
  },
  // {
  //   path: "/maps",
  //   element: (
  //     <Layout>
  //       <PrivateRoute>
  //         <Maps />
  //       </PrivateRoute>
  //     </Layout>
  //   ),
  // },
  {
    path: "/buyproduct",
    element: (
      <Layout>
        <PrivateRoute>
          <InventoryQRSystem />
        </PrivateRoute>
      </Layout>
    ),
  },
  {
    path: "/maps",
    element: (
      <Layout>
        <PrivateRoute>
          <MapsTest/>
        </PrivateRoute>
      </Layout>
    ),
  },
  {
    path: "/warehouse",
    element: (
      <Layout>
        <PrivateRoute>
          <WarehouseDashboard/>
        </PrivateRoute>
      </Layout>
    ),
  },
  {
    path: "/warehouse_test",
    element: (
      <Layout>
        <PrivateRoute>
          <WarehouseTransfer/>
        </PrivateRoute>
      </Layout>
    ),
  },
  
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;