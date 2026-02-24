import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth, hasRole } from "../context/AuthContext"; 


// navigation Pages

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// auth Page 

import Auth from "../auth/Auth";

// authorized Page

import Analytic from "../pages/Analytic";

import AdminDashboardRewrite from "../pages/AdminDashboardRewrite";
import Roles from "../pages/Roles";
import Permissions from "../pages/Permissions";
import ManagerDashboard from "../pages/ManagerDashboard";
import EmployeeDashboard from "../pages/EmployeeDashboard";
import Allocate from "../pages/Allocate";

import Task from "../pages/Task";
import CommonDashboard from "../pages/CommonDashboard";

// app pages

import Home from "../pages/Home";
// import User from "../pages/User";
import BlogPage from "../pages/BlogFeed";
// import Content from "../pages/Content";
import Profile from "../pages/Profile";
import Features from "../pages/Features";
import Employee from "../pages/Employee";

// connectivity pages

import Chat from "../pages/Chat";
// import VideoCall from "../pages/Videocall";
// import VoiceCall from "../pages/Voicecall";
import Email from "../pages/Email";
import BlogFeed from "../pages/BlogFeed";
import MyBlogs from "../pages/MyBlog";

// New Founding Member Program Pages
import PromoLanding from "../pages/PromoLanding";
import ReferralDashboard from "../pages/ReferralDashboard";
import ManagerControlCenter from "../pages/ManagerControlCenter";
import AnalyticsSuite from "../pages/AnalyticsSuite";
import ManagerPageNew from "../pages/ManagerPageNew";
import Leaderboard from "../pages/Leaderboard";
import Executives from "../pages/Executives";
import ExecutivePerformance from "../pages/ExecutivePerformance";
import VisitedCases from "../pages/VisitedCases";

// ===== PROTECTED ROUTE COMPONENT =====
// Checks both authentication and user role before rendering
const ProtectedRoute = ({ element, requiredRole, user }) => {
    if (!user) {
        return <Navigate to="/auth/login" replace />;
    }

    if (requiredRole) {
        // requiredRole may be a string or an array — hasRole now supports both
        const allowed = hasRole(user, requiredRole);
        if (!allowed) return <Navigate to="/unauthorized" replace />;
    }

    return element;
};

// ===== UNAUTHORIZED PAGE =====
const UnauthorizedPage = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-700 mb-6">You do not have permission to access this page.</p>
            <a href="/dashboard" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                Go to Dashboard
            </a>
        </div>
    </div>
);

function ProjectRoute() {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading Finance Portal...</div>;

    return (
        <>
            {/* <Navbar /> */}
            
            <Routes>
                {/* Public Pages: Everyone can see these */}
                <Route path="/" element={<Home />} />
                <Route path="/promo" element={<PromoLanding />} />
                <Route path="/blog" element={<BlogFeed />} />
                <Route path="/features" element={<Features />} />
                <Route path="/auth/login" element={!user ? <Auth /> : <Navigate to="/dashboard" />} />
                <Route path="/auth/signup" element={!user ? <Auth /> : <Navigate to="/auth/login" />} />

                {/* Unauthorized Page */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="/feedback" element={<Employee />} />

                {/* Public Shared Pages */}
                <Route path="/referral/dashboard" element={ <ReferralDashboard /> } />
                <Route path="/manager/control-center" element={ <ManagerControlCenter /> } />
                <Route path="/analytics/suite" element={ <AnalyticsSuite /> } />

                {/* ADMIN ONLY ROUTES - Requires Admin Role */}
                <Route path="/admin" element={<ProtectedRoute element={<AdminDashboardRewrite />} requiredRole="admin" user={user} />} />
                <Route path="/admin/roles" element={<ProtectedRoute element={<Roles />} requiredRole="admin" user={user} />} />
                <Route path="/admin/permissions" element={<ProtectedRoute element={<Permissions />} requiredRole="admin" user={user} />} />

                {/* MANAGER ONLY ROUTES - Requires Manager Role */}
                <Route path="/manager/page" element={<ProtectedRoute element={<ManagerPageNew />} requiredRole="manager" user={user} />} />

                {/* Leaderboard: restricted to super_admin, supervisor, manager */}
                <Route path="/leaderboard" element={<ProtectedRoute element={<Leaderboard />} requiredRole={["super_admin", "supervisor", "manager"]} user={user} />} />

                {/* Executives list and performance pages */}
                <Route path="/executives" element={<ProtectedRoute element={<Executives />} requiredRole={["super_admin", "supervisor", "manager"]} user={user} />} />
                <Route path="/executives/:id" element={<ProtectedRoute element={<ExecutivePerformance />} requiredRole={["super_admin", "supervisor", "manager"]} user={user} />} />
                <Route path="/visited" element={<ProtectedRoute element={<VisitedCases />} requiredRole={["super_admin", "supervisor", "manager"]} user={user} />} />

                {/* GENERAL PROTECTED ROUTES - Any authenticated user */}
                <Route path="/manager/dashboard" element={user ? <ManagerDashboard /> : <Navigate to="/auth/login" />} />
                <Route path="/employee" element={user ? <EmployeeDashboard /> : <Navigate to="/auth/login" />} />
                
                <Route path="/dashboard" element={user ? <CommonDashboard /> : <Navigate to="/auth/login" />} />
                <Route path="/blog/my-blogs" element={user ? <MyBlogs /> : <Navigate to="/Auth" />} />
                <Route path="/allocate" element={<Allocate />}/>
                <Route path="/analytic" element={user ? <Analytic /> : <Navigate to="/Auth" />} />
                <Route path="/task" element={user ? <Task /> : <Navigate to="/Auth" />} />
                <Route path="/profile" element={user ? <Profile /> : <Navigate to="/Auth" />} />
                <Route path="/chat" element={user ? <Chat /> : <Navigate to="/Auth" />} />
                <Route path="/email" element={user ? <Email /> : <Navigate to="/Auth" />} />
            </Routes>
            <Footer />
        </>
    );
}

export default ProjectRoute;