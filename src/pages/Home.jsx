import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import logo from '../assets/images/logo.png';
import campus1 from '../assets/images/CAMPUS.jpg';
import campus2 from '../assets/images/CAMPUS2.jpg';

const Home = () => {
    const { user, role } = useAuth();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = [campus1, campus2];

    // Custom Slider Logic (100% reliable vs Bootstrap JS)
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 3000); // Change every 3 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="position-relative vh-100 overflow-hidden bg-dark">
            {/* Background Images */}
            {images.map((img, index) => (
                <div
                    key={index}
                    className="position-absolute top-0 start-0 w-100 h-100"
                    style={{
                        backgroundImage: `url(${img})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: index === currentImageIndex ? 1 : 0,
                        transition: 'opacity 1s ease-in-out',
                        zIndex: 1
                    }}
                />
            ))}

            {/* Dark Overlay */}
            <div
                className="position-absolute top-0 start-0 w-100 h-100"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 2 }}
            />

            {/* Main Content */}
            <div
                className="position-relative w-100 h-100 d-flex justify-content-center align-items-center"
                style={{ zIndex: 3 }}
            >
                <div className="text-center text-white p-4 container">
                    {/* Logo Area */}
                    <div className="mb-4 d-flex justify-content-center">
                        <img
                            src={logo}
                            alt="Future University Logo"
                            className="img-fluid shadow-lg"
                            style={{
                                maxWidth: '150px',
                                backgroundColor: 'white',
                                padding: '10px',
                                borderRadius: '8px'
                            }}
                        />
                    </div>

                    <h1 className="display-3 fw-bold mb-4">Future University LMS</h1>

                    <div className="col-lg-8 mx-auto">
                        <p className="lead mb-5 opacity-75">
                            Welcome to the next generation of learning. Manage your courses, access learning materials, and track your progress all in one place.
                        </p>

                        {/* Buttons Container - Explicit Flex Column */}
                        <div className="d-flex flex-column align-items-center gap-4">

                            {/* Row 1: Dashboard / Auth */}
                            <div className="d-flex gap-3 justify-content-center flex-wrap">
                                {user ? (
                                    <Link
                                        to={role === 'admin' ? '/admin' : role === 'instructor' ? '/instructor' : '/student'}
                                        className="btn btn-primary btn-lg px-5 py-3 fw-bold rounded-pill shadow"
                                    >
                                        Go to Dashboard ({role})
                                    </Link>
                                ) : (
                                    <>
                                        <Link to="/auth" className="btn btn-primary btn-lg px-5 fw-bold rounded-pill shadow">
                                            Login
                                        </Link>
                                        <Link to="/auth" className="btn btn-outline-light btn-lg px-5 fw-bold rounded-pill">
                                            Sign Up
                                        </Link>
                                    </>
                                )}
                            </div>

                            {/* Row 2: Virtual Tour (Explicitly below) */}
                            <a
                                href="https://panel123.s3.ap-south-1.amazonaws.com/360futuregroup/index.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-warning btn-lg px-5 py-3 fw-bold rounded-pill shadow text-dark"
                                style={{
                                    animation: 'pulse 2s infinite'
                                }}
                            >
                                <i className="bi bi-globe me-2"></i>
                                VIRTUAL TOUR OF FUTURE UNIVERSITY
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simple CSS animation for the tour button */}
            <style>
                {`
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                `}
            </style>
        </div>
    );
};

export default Home;
