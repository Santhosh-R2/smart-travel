import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Common Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Public Pages
import LandingPage from './components/common/LandingPage';
import AboutPage from './components/common/AboutPage';
import ContactPage from './components/common/ContactPage';

// Auth Pages
import AdminLogin from './pages/admin/AdminLogin';
import UserLogin from './pages/user/UserLogin';
import UserRegister from './pages/user/UserRegister';
import ForgotPassword from './pages/user/ForgotPassword';
import ResetPassword from './pages/user/ResetPassword';

// Dashboard & Layouts

import UserDashboard from './pages/user/UserDashboard';
import AdminLayout from './components/layout/AdminLayout';
import UserLayout from './components/layout/UserLayout';
import ProfilePage from './pages/user/ProfilePage';
import AIPlanner from './pages/user/AIPlanner';


import MyTrips from './pages/user/MyTrips';
import Budgeting from './pages/user/Budgeting';
import Security from './pages/user/Security';
import AiChat from './pages/user/AiChat';

// A Helper Component for Public Pages (Navbar + Footer)
const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
  </>
);

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>

          {/* --- PUBLIC ROUTES (With Navbar & Footer) --- */}
          <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />

          {/* --- AUTH ROUTES (Still using Public Layout for consistent branding) --- */}
          <Route path="/admin-login" element={<PublicLayout><AdminLogin /></PublicLayout>} />
          <Route path="/user-login" element={<PublicLayout><UserLogin /></PublicLayout>} />
          <Route path="/register" element={<PublicLayout><UserRegister /></PublicLayout>} />
          <Route path="/forgot-password" element={<PublicLayout><ForgotPassword /></PublicLayout>} />
          <Route path="/reset-password" element={<PublicLayout><ResetPassword /></PublicLayout>} />

          {/* --- USER PRIVATE ROUTES (With Sidebar UserLayout) --- */}
          {/* Note: UserLayout already has its own Header and Sidebar internally */}
          <Route
            path="/user-dashboard"
            element={
              <UserLayout>
                <UserDashboard />
              </UserLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <UserLayout>
                <ProfilePage />
              </UserLayout>
            }
          />
          <Route
            path="/ai-planner"
            element={
              <UserLayout>
                <AIPlanner />
              </UserLayout>
            }
          />
          <Route
            path="/my-trips"
            element={
              <UserLayout>
                <MyTrips />
              </UserLayout>
            }
          />
          <Route
            path="/budget"
            element={
              <UserLayout>
                <Budgeting />
              </UserLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <UserLayout>
                <Security />
              </UserLayout>
            }
          />
          <Route
            path="/ai-chat"
            element={
              <UserLayout>
                <AiChat />
              </UserLayout>
            }
          />

          {/* --- ADMIN PRIVATE ROUTES (With Sidebar AdminLayout) --- */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminLayout>
                <div>Admin Dashboard Content Goes Here</div>
              </AdminLayout>
            }
          />

        </Routes>
      </div>
    </Router>
  );
}

export default App;