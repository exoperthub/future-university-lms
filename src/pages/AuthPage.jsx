import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthProvider';
import logo from '../assets/images/logo.png';

import { degreePrograms } from '../constants/degreePrograms';

const AuthPage = () => {
    const navigate = useNavigate();
    const { user, role } = useAuth();

    // Mode: 'login', 'signup', 'forgot_password'
    const [mode, setMode] = useState('login');
    // Login Method: 'password', 'otp'
    const [loginMethod, setLoginMethod] = useState('password');
    // OTP State: 'send', 'verify'
    const [otpStep, setOtpStep] = useState('send');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [name, setName] = useState('');
    const [selectedRole, setSelectedRole] = useState('student'); // Default student
    const [selectedProgram, setSelectedProgram] = useState(''); // New State
    const [needsVerification, setNeedsVerification] = useState(false);

    useEffect(() => {
        if (user && role) {
            redirectBasedOnRole(role);
        }
    }, [user, role]);

    const redirectBasedOnRole = (roleName) => {
        switch (roleName) {
            case 'admin': navigate('/admin'); break;
            case 'instructor': navigate('/instructor'); break;
            case 'student': navigate('/student'); break;
            default: navigate('/');
        }
    };

    // 1. Send OTP Code
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        // NOTE: For this to work as a CODE, the Supabase Email Template 
        // for 'Magic Link' MUST use {{ .Token }} instead of {{ .ConfirmationURL }}
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: false // Ensure only existing users can login
            }
        });

        if (error) {
            setError(error.message);
        } else {
            setOtpStep('verify');
            setMessage(`OTP sent to ${email}. Check your inbox!`);
        }
        setLoading(false);
    };

    // 2. Verify OTP Code
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: otpCode,
            type: 'email'
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Success! AuthProvider will react to session change
        }
    };

    const handleLoginPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const { result, error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
            if (authError.message.includes("Email not confirmed")) {
                setNeedsVerification(true);
                setError("Please verify your email address to login.");
            } else {
                setError(authError.message);
            }
        }
        setLoading(false);
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setNeedsVerification(false);

        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    role: 'student', // Force student role
                    program: selectedProgram // Add program to metadata
                },
                emailRedirectTo: `${window.location.origin}/auth`
            }
        });

        if (authError) {
            let msg = authError.message;
            if (authError.status === 429) msg = "Rate limit exceeded. Wait 60s.";
            setError(msg);
        } else if (data.user && !data.session) {
            // Don't show the yellow 'needsVerification' alert immediately, 
            // just show the green success message with instructions.
            setNeedsVerification(false);
            setMessage("A Verification E-Mail is sent to you on given email, Verify your email id to activate your LMS account");
            setMode('login');
        }
        setLoading(false);
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage("Password reset link sent to your email!");
            setTimeout(() => setMode('login'), 3000);
        }
        setLoading(false);
    };

    const handleResendVerification = async () => {
        setLoading(true);
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });
        if (error) setError(error.message);
        else setMessage("Verification email resent!");
        setLoading(false);
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100 bg-light">
            <div
                className="card shadow-lg p-4 text-white"
                style={{
                    maxWidth: '450px',
                    width: '100%',
                    background: 'linear-gradient(135deg, #a93226 0%, #2c3e50 100%)',
                    border: 'none',
                    minHeight: '500px'
                }}
            >
                <div className="text-center mb-3">
                    <Link to="/">
                        <img
                            src={logo}
                            alt="Future University"
                            style={{
                                maxWidth: '120px',
                                backgroundColor: 'white',
                                padding: '8px',
                                borderRadius: '8px'
                            }}
                        />
                    </Link>
                </div>

                {/* State: Messages/Errors (Top Priority) */}
                {message && <div className="alert alert-success text-dark">{message}</div>}
                {error && <div className="alert alert-danger text-dark">{error}</div>}

                {/* State: Verification Needed (Actionable, below status) */}
                {needsVerification && (
                    <div className="alert alert-warning text-dark text-center">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        Verify your email to continue.
                        <div className="mt-2">
                            <button onClick={handleResendVerification} className="btn btn-sm btn-outline-dark" disabled={loading}>
                                Resend Verification Email
                            </button>
                        </div>
                    </div>
                )}

                {/* VIEW: FORGOT PASSWORD */}
                {mode === 'forgot_password' && (
                    <>
                        <h4 className="text-center mb-3">Reset Password</h4>
                        <p className="text-center small opacity-75">Enter your email to receive instructions.</p>
                        <form onSubmit={handleForgotPassword}>
                            <div className="mb-3">
                                <label className="form-label">Email Address</label>
                                <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <button type="submit" className="btn btn-warning w-100 mb-3 fw-bold" disabled={loading}>
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                        <button className="btn btn-link text-white w-100" onClick={() => setMode('login')}>
                            Back to Login
                        </button>
                    </>
                )}

                {/* VIEW: LOGIN */}
                {mode === 'login' && (
                    <>
                        <h4 className="text-center mb-3">Login</h4>

                        {/* Login Method Tabs */}
                        <ul className="nav nav-pills nav-fill mb-4 gap-2">
                            <li className="nav-item">
                                <button
                                    className={`nav-link border-0 btn-sm ${loginMethod === 'password' ? 'active bg-white text-primary' : 'bg-transparent text-white border border-white'}`}
                                    onClick={() => { setLoginMethod('password'); setOtpStep('send'); }}
                                >
                                    Password
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link border-0 btn-sm ${loginMethod === 'otp' ? 'active bg-white text-primary' : 'bg-transparent text-white border border-white'}`}
                                    onClick={() => { setLoginMethod('otp'); setOtpStep('send'); }}
                                >
                                    Email OTP
                                </button>
                            </li>
                        </ul>

                        {/* SUB-VIEW: PASSWORD LOGIN */}
                        {loginMethod === 'password' && (
                            <form onSubmit={handleLoginPassword}>
                                <div className="mb-3">
                                    <label className="form-label">Email Address</label>
                                    <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                    <div className="text-end mt-1">
                                        <button type="button" className="btn btn-link text-white p-0 small" style={{ textDecoration: 'none' }} onClick={() => setMode('forgot_password')}>
                                            Forgot Password?
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-light w-100 mb-3 text-primary fw-bold" disabled={loading}>
                                    {loading ? 'Processing...' : 'Login'}
                                </button>
                            </form>
                        )}

                        {/* SUB-VIEW: OTP LOGIN */}
                        {loginMethod === 'otp' && (
                            <>
                                {otpStep === 'send' ? (
                                    <form onSubmit={handleSendOtp}>
                                        <div className="mb-3">
                                            <label className="form-label">Email Address</label>
                                            <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                        </div>
                                        <button type="submit" className="btn btn-light w-100 mb-3 text-primary fw-bold" disabled={loading}>
                                            {loading ? 'Sending...' : 'Send OTP Code'}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleVerifyOtp}>
                                        <div className="mb-3">
                                            <label className="form-label">Enter OTP Code</label>
                                            <input
                                                type="text"
                                                className="form-control text-center text-primary fw-bold fs-4"
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value)}
                                                placeholder="123456"
                                                maxLength={6}
                                                required
                                            />
                                            <div className="text-center mt-2">
                                                <small className="opacity-75">Check your email for the code</small>
                                            </div>
                                        </div>
                                        <button type="submit" className="btn btn-light w-100 mb-3 text-primary fw-bold" disabled={loading}>
                                            {loading ? 'Verifying...' : 'Verify & Login'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-link text-white w-100 p-0"
                                            onClick={() => setOtpStep('send')}
                                        >
                                            Try Different Email
                                        </button>
                                    </form>
                                )}
                            </>
                        )}

                        <div className="text-center">
                            <span className="opacity-75">Don't have an account? </span>
                            <button className="btn btn-link text-white fw-bold p-0" onClick={() => setMode('signup')}>
                                Sign Up
                            </button>
                        </div>
                    </>
                )}

                {/* VIEW: SIGNUP */}
                {mode === 'signup' && (
                    <>
                        <h4 className="text-center mb-3">Create Account</h4>
                        <form onSubmit={handleSignup}>
                            <div className="mb-2">
                                <label className="form-label">Full Name</label>
                                <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Email</label>
                                <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Password</label>
                                <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>

                            {/* Program Selection (For Students) */}
                            <div className="mb-3">
                                <label className="form-label">Select Your Program</label>
                                <select
                                    className="form-select"
                                    value={selectedProgram}
                                    onChange={(e) => setSelectedProgram(e.target.value)}
                                    required
                                >
                                    <option value="">Choose your degree...</option>
                                    {degreePrograms.map((prog, idx) => (
                                        <option key={idx} value={prog}>{prog}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Default Role is hidden/fixed to 'student' */}
                            {/* <div className="mb-3">
                                <label className="form-label">I am a:</label>
                                <select className="form-select" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                                    <option value="student">Student</option>
                                </select>
                            </div> */}

                            <button type="submit" className="btn btn-light w-100 mb-3 text-primary fw-bold" disabled={loading}>
                                {loading ? 'Creating...' : 'Register'}
                            </button>
                        </form>

                        <div className="text-center">
                            <span className="opacity-75">Already registered? </span>
                            <button className="btn btn-link text-white fw-bold p-0" onClick={() => setMode('login')}>
                                Login
                            </button>
                        </div>
                    </>
                )}

                <div className="text-center mt-3 border-top pt-3 border-white border-opacity-25">
                    <Link to="/" className="btn btn-sm btn-outline-light rounded-pill px-3">
                        &larr; Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
