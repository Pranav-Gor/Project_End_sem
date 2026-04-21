import { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ThemeProvider } from './contexts/ThemeContext'
import AuctionNotifications from './components/AuctionNotifications'
import { RoleGuard, BuyerDashboardGuard, SellerVerifiedGuard, AuthGuard } from './components/RoleGuard'

// Lazy load components for better performance
const Auth = lazy(() => import('./pages/Auth'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Home = lazy(() => import('./pages/Home'))
const LiveAuctions = lazy(() => import('./pages/LiveAuctions'))
const AuctionDetail = lazy(() => import('./pages/AuctionDetail'))
const UpcomingAuctions = lazy(() => import('./pages/UpcomingAuctions'))
const ClosedAuctions = lazy(() => import('./pages/ClosedAuctions'))
const Categories = lazy(() => import('./pages/Categories'))
const Favorites = lazy(() => import('./pages/Favorites'))
const MyBids = lazy(() => import('./pages/MyBids'))
const UserDashboard = lazy(() => import('./pages/UserDashboard'))
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const Wallet = lazy(() => import('./pages/Wallet'))
const Transactions = lazy(() => import('./pages/Transactions'))
const Reports = lazy(() => import('./pages/Reports'))
const Settings = lazy(() => import('./pages/Settings'))
const SupportCenter = lazy(() => import('./pages/SupportCenter'))
const SellerAuctions = lazy(() => import('./pages/SellerAuctions'))
const SellerCreateAuction = lazy(() => import('./pages/SellerCreateAuction'))
const SellerPayouts = lazy(() => import('./pages/SellerPayouts'))
const SellerKyc = lazy(() => import('./pages/SellerKyc'))
const SellerSettings = lazy(() => import('./pages/SellerSettings'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Page transition configuration
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: "easeOut" }
}

function PageWrapper({ children, variants = pageVariants }) {
  return (
    <motion.div {...variants}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors">
          <div className="w-10 h-10 border-4 border-auctus-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        {children}
      </Suspense>
    </motion.div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/auth" element={<PageWrapper variants={{ initial: { opacity: 0, scale: 0.98 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.98 }, transition: { duration: 0.4 } }}><Auth /></PageWrapper>} />
        <Route path="/auth/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
        
        {/* Protected Marketplace Routes */}
        <Route path="/live-auctions" element={<AuthGuard><PageWrapper><LiveAuctions /></PageWrapper></AuthGuard>} />
        <Route path="/auction/:id" element={<AuthGuard><PageWrapper><AuctionDetail /></PageWrapper></AuthGuard>} />
        <Route path="/upcoming-auctions" element={<AuthGuard><PageWrapper><UpcomingAuctions /></PageWrapper></AuthGuard>} />
        <Route path="/closed-auctions" element={<AuthGuard><PageWrapper><ClosedAuctions /></PageWrapper></AuthGuard>} />
        <Route path="/categories" element={<AuthGuard><PageWrapper><Categories /></PageWrapper></AuthGuard>} />
        <Route path="/favorites" element={<AuthGuard><PageWrapper><Favorites /></PageWrapper></AuthGuard>} />
        <Route path="/my-bids" element={<AuthGuard><PageWrapper><MyBids /></PageWrapper></AuthGuard>} />

        {/* Dashboards */}
        <Route path="/dashboard" element={<BuyerDashboardGuard><PageWrapper><UserDashboard /></PageWrapper></BuyerDashboardGuard>} />
        <Route path="/dashboard/user" element={<Navigate to="/dashboard" replace />} />
        
        <Route path="/seller/dashboard" element={
          <RoleGuard allowedRoles={['seller', 'admin']}>
            <SellerVerifiedGuard><PageWrapper><SellerDashboard /></PageWrapper></SellerVerifiedGuard>
          </RoleGuard>
        } />
        
        <Route path="/admin/dashboard" element={
          <RoleGuard allowedRoles={['admin']}>
            <PageWrapper><AdminDashboard /></PageWrapper>
          </RoleGuard>
        } />

        {/* Shared User Routes */}
        <Route path="/profile" element={<AuthGuard><PageWrapper><UserProfile /></PageWrapper></AuthGuard>} />
        <Route path="/wallet" element={<AuthGuard><PageWrapper><Wallet /></PageWrapper></AuthGuard>} />
        <Route path="/transactions" element={<AuthGuard><PageWrapper><Transactions /></PageWrapper></AuthGuard>} />
        <Route path="/settings" element={<AuthGuard><PageWrapper><Settings /></PageWrapper></AuthGuard>} />
        <Route path="/support" element={<PageWrapper><SupportCenter /></PageWrapper>} />

        {/* Admin Tools */}
        <Route path="/reports" element={<RoleGuard allowedRoles={['admin']}><PageWrapper><Reports /></PageWrapper></RoleGuard>} />

        {/* Seller Specific Tools */}
        <Route path="/seller/kyc" element={<RoleGuard allowedRoles={['seller', 'admin']}><PageWrapper><SellerKyc /></PageWrapper></RoleGuard>} />
        <Route path="/seller/settings" element={<RoleGuard allowedRoles={['seller', 'admin']}><PageWrapper><SellerSettings /></PageWrapper></RoleGuard>} />
        <Route path="/seller/auctions" element={
          <RoleGuard allowedRoles={['seller', 'admin']}>
            <SellerVerifiedGuard><PageWrapper><SellerAuctions /></PageWrapper></SellerVerifiedGuard>
          </RoleGuard>
        } />
        <Route path="/seller/auctions/new" element={
          <RoleGuard allowedRoles={['seller', 'admin']}>
            <SellerVerifiedGuard><PageWrapper><SellerCreateAuction /></PageWrapper></SellerVerifiedGuard>
          </RoleGuard>
        } />
        <Route path="/seller/payouts" element={
          <RoleGuard allowedRoles={['seller', 'admin']}>
            <SellerVerifiedGuard><PageWrapper><SellerPayouts /></PageWrapper></SellerVerifiedGuard>
          </RoleGuard>
        } />

        {/* Redirects & 404 */}
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/register" element={<Navigate to="/auth" replace />} />
        <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AnimatedRoutes />
        <AuctionNotifications />
      </Router>
    </ThemeProvider>
  )
}

export default App
