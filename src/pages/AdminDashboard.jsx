import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { degreePrograms } from '../constants/degreePrograms';
import { useAuth } from '../context/AuthProvider';

import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState([]);

    // Create Course State
    const [newCourseTitle, setNewCourseTitle] = useState('');
    const [newCourseDesc, setNewCourseDesc] = useState('');
    const [createError, setCreateError] = useState(null);

    useEffect(() => {
        fetchRoles();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'courses') fetchCourses();
    }, [activeTab]);

    const fetchRoles = async () => {
        const { data } = await supabase.from('roles').select('*');
        if (data) setRoles(data);
    };

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*, roles(name)')
            .order('name');

        if (error) console.error(error);
        else setUsers(data || []);
        setLoading(false);
    };

    const fetchCourses = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('courses')
            .select('*, profiles!courses_instructor_id_fkey(name)')
            .order('title');

        if (error) console.error(error);
        else setCourses(data || []);
        setLoading(false);
    };

    const handleRoleChange = async (userId, newRoleId) => {
        const { error } = await supabase
            .from('profiles')
            .update({ role_id: newRoleId })
            .eq('id', userId);

        if (error) alert('Error updating role: ' + error.message);
        else fetchUsers();
    };

    const handleStatusChange = async (userId, newStatus) => {
        if (!window.confirm(`Are you sure you want to set this user to ${newStatus}?`)) return;

        const { error } = await supabase
            .from('profiles')
            .update({ status: newStatus })
            .eq('id', userId);

        if (error) alert('Error updating status: ' + error.message);
        else fetchUsers();
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        setCreateError(null);

        if (!newCourseTitle.trim()) return;

        try {
            // Admins can create courses. We assign the admin as the instructor by default,
            // or we could add a field to select an instructor. For now, assign to self (Admin).
            const { data, error } = await supabase
                .from('courses')
                .insert([
                    {
                        title: newCourseTitle,
                        description: newCourseDesc,
                        instructor_id: user.id,
                    },
                ])
                .select();

            if (error) throw error;

            setCourses([...courses, ...data]);
            setNewCourseTitle('');
            setNewCourseDesc('');
            alert('Course created successfully!');
        } catch (error) {
            setCreateError(error.message);
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm('Are you sure? This will delete the course and all its lessons.')) return;

        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', courseId);

        if (error) alert('Error deleting course: ' + error.message);
        else fetchCourses();
    };

    return (
        <DashboardLayout title="Admin Dashboard">
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Manage Users
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'courses' ? 'active' : ''}`}
                        onClick={() => setActiveTab('courses')}
                    >
                        Manage Courses
                    </button>
                </li>
            </ul>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <>
                    {activeTab === 'users' && (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Current Role</th>
                                        <th>Change Role</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td>{user.name}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`badge ${user.status === 'banned' ? 'bg-danger' : 'bg-success'
                                                    }`}>
                                                    {user.status || 'active'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${user.roles?.name === 'admin' ? 'bg-danger' :
                                                    user.roles?.name === 'instructor' ? 'bg-primary' : 'bg-info'
                                                    }`}>
                                                    {user.roles?.name || 'Unknown'}
                                                </span>
                                            </td>
                                            <td>
                                                <select
                                                    className="form-select form-select-sm"
                                                    style={{ maxWidth: '150px' }}
                                                    value={user.role_id}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                >
                                                    {roles.map(role => (
                                                        <option key={role.id} value={role.id}>{role.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                {user.status === 'banned' ? (
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => handleStatusChange(user.id, 'active')}
                                                    >
                                                        Unban
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleStatusChange(user.id, 'banned')}
                                                    >
                                                        Ban
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'courses' && (
                        <div>
                            {/* Create Course Section for Admin */}
                            <div className="card mb-4">
                                <div className="card-header">
                                    Create New Course
                                </div>
                                <div className="card-body">
                                    {createError && <div className="alert alert-danger">{createError}</div>}
                                    <form onSubmit={handleCreateCourse}>
                                        <div className="mb-3">
                                            <label className="form-label">Course Title</label>
                                            <select
                                                className="form-select"
                                                value={newCourseTitle}
                                                onChange={(e) => setNewCourseTitle(e.target.value)}
                                                required
                                            >
                                                <option value="">Select a Program...</option>
                                                {degreePrograms.map((program, index) => (
                                                    <option key={index} value={program}>{program}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Description</label>
                                            <textarea
                                                className="form-control"
                                                rows="2"
                                                value={newCourseDesc}
                                                onChange={(e) => setNewCourseDesc(e.target.value)}
                                            ></textarea>
                                        </div>
                                        <button type="submit" className="btn btn-primary">Create Course</button>
                                    </form>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Description</th>
                                            <th>Instructor</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {courses.map(course => (
                                            <tr key={course.id}>
                                                <td>{course.title}</td>
                                                <td>{course.description}</td>
                                                <td>{course.profiles?.name || 'Unknown'}</td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => navigate(`/admin/course/${course.id}`)}
                                                        >
                                                            Manage
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleDeleteCourse(course.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </DashboardLayout>
    );
};

export default AdminDashboard;
