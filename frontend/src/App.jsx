import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import Footer from '@/components/layout/Footer'
import PublicNavbar from '@/components/layout/PublicNavbar'
import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/context/AuthContext'
import { homeForRole } from '@/lib/utils'

// Public pages
import Landing from '@/pages/Landing'
import Marketplace from '@/pages/Marketplace'
import ProductDetail from '@/pages/ProductDetail'
import Farmers from '@/pages/Farmers'
import FarmerProfile from '@/pages/FarmerProfile'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import NotFound from '@/pages/NotFound'

// Shared authenticated pages
import Messages from '@/pages/Messages'
import Profile from '@/pages/Profile'

// Farmer
import FarmerDashboard from '@/pages/farmer/Dashboard'
import FarmerProducts from '@/pages/farmer/Products'
import ProductForm from '@/pages/farmer/ProductForm'
import FarmerOrders from '@/pages/farmer/Orders'

// Buyer
import BuyerDashboard from '@/pages/buyer/Dashboard'
import BuyerOrders from '@/pages/buyer/Orders'

// Admin
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminUsers from '@/pages/admin/Users'
import AdminProducts from '@/pages/admin/Products'
import AdminReports from '@/pages/admin/Reports'

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

function AuthRedirect() {
  const { user } = useAuth()
  if (user) return <Navigate to={homeForRole(user.role)} replace />
  return <Outlet />
}

function ScrollToHash() {
  const { hash, pathname } = useLocation()
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 })
      return
    }
    const element = document.querySelector(hash)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [hash, pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToHash />
      <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/farmers" element={<Farmers />} />
        <Route path="/farmers/:id" element={<FarmerProfile />} />
      </Route>

      {/* Auth (redirect if already logged in) */}
      <Route element={<AuthRedirect />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Authenticated app */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/farmer"
          element={
            <ProtectedRoute roles={['farmer']}>
              <FarmerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/products"
          element={
            <ProtectedRoute roles={['farmer']}>
              <FarmerProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/products/new"
          element={
            <ProtectedRoute roles={['farmer']}>
              <ProductForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/products/:id/edit"
          element={
            <ProtectedRoute roles={['farmer']}>
              <ProductForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer/orders"
          element={
            <ProtectedRoute roles={['farmer']}>
              <FarmerOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer"
          element={
            <ProtectedRoute roles={['buyer']}>
              <BuyerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buyer/orders"
          element={
            <ProtectedRoute roles={['buyer']}>
              <BuyerOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminReports />
            </ProtectedRoute>
          }
        />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
