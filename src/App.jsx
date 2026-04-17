import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Auth from './pages/Auth'
import ForgotPassword from './pages/ForgotPassword'
import Home from './pages/Home'
import LiveAuctions from './pages/LiveAuctions'
import AuctionDetail from './pages/AuctionDetail'
import UpcomingAuctions from './pages/UpcomingAuctions'
import ClosedAuctions from './pages/ClosedAuctions'
import MyBids from './pages/MyBids'
import UserDashboard from './pages/UserDashboard'
import SellerDashboard from './pages/SellerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import UserProfile from './pages/UserProfile'
import Wallet from './pages/Wallet'
import Transactions from './pages/Transactions'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import SupportCenter from './pages/SupportCenter'
import SellerAuctions from './pages/SellerAuctions'
import SellerCreateAuction from './pages/SellerCreateAuction'
import SellerPayouts from './pages/SellerPayouts'
import SellerKyc from './pages/SellerKyc'
import NotFound from './pages/NotFound'
import { RoleGuard, BuyerDashboardGuard, SellerVerifiedGuard, AuthGuard } from './components/RoleGuard'
import { ThemeProvider } from './contexts/ThemeContext'

// Page transition wrapper
function PageTransition({ children }) {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Animated routes component
function AnimatedRoutes() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Home />
          </motion.div>
        } />
        <Route path="/home" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Home />
          </motion.div>
        } />
        <Route path="/auth" element={
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, ease: "easeOut" }}>
            <Auth />
          </motion.div>
        } />
        <Route path="/auth/forgot-password" element={
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, ease: "easeOut" }}>
            <ForgotPassword />
          </motion.div>
        } />
        <Route path="/live-auctions" element={
          <AuthGuard>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <LiveAuctions />
            </motion.div>
          </AuthGuard>
        } />
        <Route path="/auction/:id" element={
          <AuthGuard>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <AuctionDetail />
            </motion.div>
          </AuthGuard>
        } />
        <Route path="/upcoming-auctions" element={
          <AuthGuard>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <UpcomingAuctions />
            </motion.div>
          </AuthGuard>
        } />
        <Route path="/closed-auctions" element={
          <AuthGuard>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <ClosedAuctions />
            </motion.div>
          </AuthGuard>
        } />
        <Route path="/my-bids" element={
          <AuthGuard>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <MyBids />
            </motion.div>
          </AuthGuard>
        } />

        {/* Dashboards */}
        <Route path="/dashboard" element={
          <BuyerDashboardGuard>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
              <UserDashboard />
            </motion.div>
          </BuyerDashboardGuard>
        } />
        {/* Alias: same buyer dashboard (some links use /dashboard/user) */}
        <Route path="/dashboard/user" element={
          <BuyerDashboardGuard>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
              <UserDashboard />
            </motion.div>
          </BuyerDashboardGuard>
        } />
        <Route path="/seller/dashboard" element={
          <RoleGuard allowedRoles={['seller', 'admin']}>
            <SellerVerifiedGuard>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
                <SellerDashboard />
              </motion.div>
            </SellerVerifiedGuard>
          </RoleGuard>
        } />
        <Route path="/seller/kyc" element={
          <RoleGuard allowedRoles={['seller', 'admin']}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
              <SellerKyc />
            </motion.div>
          </RoleGuard>
        } />
        <Route path="/admin/dashboard" element={
          <RoleGuard allowedRoles={['admin']}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
              <AdminDashboard />
            </motion.div>
          </RoleGuard>
        } />

        {/* Account & analytics */}
        <Route path="/profile" element={
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
            <UserProfile />
          </motion.div>
        } />
        <Route path="/wallet" element={
          <AuthGuard>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <Wallet />
            </motion.div>
          </AuthGuard>
        } />
        <Route path="/transactions" element={
          <AuthGuard>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <Transactions />
            </motion.div>
          </AuthGuard>
        } />
        <Route path="/reports" element={
          <RoleGuard allowedRoles={['admin']}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
              <Reports />
            </motion.div>
          </RoleGuard>
        } />
        <Route path="/settings" element={
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
            <Settings />
          </motion.div>
        } />
        <Route path="/support" element={
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
            <SupportCenter />
          </motion.div>
        } />

        {/* Seller tools */}
        <Route path="/seller/auctions" element={
          <RoleGuard allowedRoles={['seller', 'admin']}>
            <SellerVerifiedGuard>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                <SellerAuctions />
              </motion.div>
            </SellerVerifiedGuard>
          </RoleGuard>
        } />
        <Route path="/seller/auctions/new" element={
          <RoleGuard allowedRoles={['seller', 'admin']}>
            <SellerVerifiedGuard>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                <SellerCreateAuction />
              </motion.div>
            </SellerVerifiedGuard>
          </RoleGuard>
        } />
        <Route path="/seller/payouts" element={
          <RoleGuard allowedRoles={['seller', 'admin']}>
            <SellerVerifiedGuard>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                <SellerPayouts />
              </motion.div>
            </SellerVerifiedGuard>
          </RoleGuard>
        } />
        {/* Legacy routes redirect to new unified auth page */}
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/register" element={<Navigate to="/auth" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
        <Route path="/categories" element={<Navigate to="/" replace />} />
        <Route path="/favorites" element={<Navigate to="/" replace />} />

        <Route path="*" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <NotFound />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </ThemeProvider>
  )
}

export default App
