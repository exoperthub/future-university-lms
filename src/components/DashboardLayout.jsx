import React, { useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import { useNavigate, Link } from 'react-router-dom';
import logo from "../assets/images/logo.png";


const DashboardLayout = ({ children, title }) => {
    const { user, role, signOut } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await signOut();
        navigate('/auth');
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebarPoints = () => {
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }

    return (
        <div className="d-flex vh-100 bg-light position-relative">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay d-md-none"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <div className={`d-flex flex-column flex-shrink-0 p-3 text-white bg-dark sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="d-flex align-items-center justify-content-between mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                    <Link to="/" className="d-flex align-items-center text-white text-decoration-none" onClick={closeSidebarPoints}>
                        <img
                            src={logo}
                            alt="Logo"
                            style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                            className="me-2"
                        />
                        <span className="fs-5 fw-bold">Future University LMS</span>
                    </Link>
                    {/* Close button for mobile inside sidebar - optional but good for accessibility */}
                    <button className="btn btn-link text-white d-md-none" onClick={() => setIsSidebarOpen(false)}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <hr />

                <ul className="nav nav-pills flex-column mb-4 mb-md-auto">
                    {role === 'admin' && (
                        <li className="nav-item">
                            <Link to="/admin" className="nav-link text-white" onClick={closeSidebarPoints}>
                                Dashboard
                            </Link>
                        </li>
                    )}
                    {role === 'instructor' && (
                        <>
                            <li className="nav-item">
                                <Link to="/instructor" className="nav-link text-white" onClick={closeSidebarPoints}>
                                    My Courses
                                </Link>
                            </li>
                            {/* Add more instructor links here */}
                        </>
                    )}
                    {role === 'student' && (
                        <>
                            <li className="nav-item">
                                <Link to="/student" className="nav-link text-white" onClick={closeSidebarPoints}>
                                    My Learning
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/student" className="nav-link text-white" onClick={closeSidebarPoints}>
                                    Browse Courses
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
                <hr />
                <div className="dropdown">
                    <a href="#" className="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
                        <strong>{user?.email}</strong>
                    </a>
                    <ul className="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
                        <li><button className="dropdown-item" onClick={handleLogout}>Sign out</button></li>
                    </ul>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow-1 d-flex flex-column" style={{ overflowY: 'auto' }}>
                <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm border-bottom">
                    <div className="container-fluid">
                        {/* Toggle Button - Visible only on mobile */}
                        <button
                            className="btn btn-light d-md-none me-3"
                            type="button"
                            onClick={toggleSidebar}
                            aria-label="Toggle navigation"
                        >
                            <i className="bi bi-list fs-4"></i>
                        </button>

                        <span className="navbar-brand mb-0 h1">{title || 'Dashboard'}</span>
                    </div>
                </nav>

                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
