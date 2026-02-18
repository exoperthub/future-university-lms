import React from 'react';
import { useAuth } from '../context/AuthProvider';
import { useNavigate, Link } from 'react-router-dom';
import logo from "../assets/images/logo.png";


const DashboardLayout = ({ children, title }) => {
    const { user, role, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/auth');
    };

    return (
        <div className="d-flex vh-100 bg-light">
            {/* Sidebar */}
            <div className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark" style={{ width: '280px' }}>
                <Link to="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                    <img
  src={logo}
  alt="Logo"
  style={{ width: "40px", height: "40px", borderRadius: "50%" }}
/>

                    <span className="fs-5 fw-bold">Future University LMS</span>
                </Link>
                <hr />
                <ul className="nav nav-pills flex-column mb-auto">
                    {role === 'admin' && (
                        <li className="nav-item">
                            <Link to="/admin" className="nav-link text-white">
                                Dashboard
                            </Link>
                        </li>
                    )}
                    {role === 'instructor' && (
                        <>
                            <li className="nav-item">
                                <Link to="/instructor" className="nav-link text-white">
                                    My Courses
                                </Link>
                            </li>
                            {/* Add more instructor links here */}
                        </>
                    )}
                    {role === 'student' && (
                        <>
                            <li className="nav-item">
                                <Link to="/student" className="nav-link text-white">
                                    My Learning
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/student" className="nav-link text-white">
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
