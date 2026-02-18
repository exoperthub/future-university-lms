import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

const RoleRoute = ({ allowedRoles }) => {
    const { user, role, loading } = useAuth();

    if (loading) {
        return <div className="container mt-5">Loading permissions...</div>;
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    if (!allowedRoles.includes(role)) {
        // Redirect to appropriate dashboard based on actual role
        if (role === 'admin') return <Navigate to="/admin" replace />;
        if (role === 'instructor') return <Navigate to="/instructor" replace />;
        if (role === 'student') return <Navigate to="/student" replace />;

        // Fallback if role is unknown or not handled
        return <div className="container mt-5">Access Denied</div>;
    }

    return <Outlet />;
};

export default RoleRoute;
