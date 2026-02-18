import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import logo from '../assets/images/logo.png';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if we are in a password recovery session
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                // User is here to reset password
            }
        });
    }, []);

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage('Password updated successfully! Redirecting to login...');
            setTimeout(() => {
                navigate('/auth');
            }, 3000);
        }
        setLoading(false);
    };

    return (
        <div
            className="container-fluid d-flex justify-content-center align-items-center vh-100"
            style={{
                background: 'linear-gradient(135deg, #a93226 0%, #2c3e50 100%)'
            }}
        >
            <div
                className="card shadow-lg p-4 text-white lead"
                style={{
                    maxWidth: '400px',
                    width: '100%',
                    background: 'linear-gradient(135deg, #a93226 0%, #2c3e50 100%)',
                    border: 'none'
                }}
            >
                <div className="text-center mb-4">
                    <img
                        src={logo}
                        alt="Future University"
                        style={{
                            maxWidth: '150px',
                            backgroundColor: 'white',
                            padding: '10px',
                            borderRadius: '8px'
                        }}
                    />
                </div>
                <h4 className="text-center mb-4 text-white">Set New Password</h4>

                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleReset}>
                    <div className="mb-3">
                        <label className="form-label">New Password</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <button type="submit" className="btn btn-light w-100 text-primary fw-bold" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
