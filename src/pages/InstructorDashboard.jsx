import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthProvider';
import DashboardLayout from '../components/DashboardLayout';
import { degreePrograms } from '../constants/degreePrograms';

const InstructorDashboard = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCourseTitle, setNewCourseTitle] = useState('');
    const [newCourseDesc, setNewCourseDesc] = useState('');
    const [createError, setCreateError] = useState(null);

    useEffect(() => {
        if (user) {
            fetchCourses();
        }
    }, [user]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .eq('instructor_id', user.id)
                .order('title', { ascending: true });

            if (error) throw error;
            setCourses(data || []);
        } catch (error) {
            console.error('Error fetching courses:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        setCreateError(null);

        if (!newCourseTitle.trim()) return;

        try {
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
        } catch (error) {
            setCreateError(error.message);
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm('Are you sure you want to delete this course?')) return;

        try {
            const { error } = await supabase
                .from('courses')
                .delete()
                .eq('id', courseId);

            if (error) throw error;

            setCourses(courses.filter((course) => course.id !== courseId));
        } catch (error) {
            console.error('Error deleting course:', error.message);
            alert('Error deleting course');
        }
    };

    return (
        <DashboardLayout title="Instructor Dashboard">
            <div className="d-flex justify-content-end mb-4">
                <button
                    className="btn btn-primary"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#createCourseForm"
                    aria-expanded="false"
                    aria-controls="createCourseForm"
                >
                    Create New Course
                </button>
            </div>

            {/* Create Course Form (Collapsible) */}
            <div className="collapse mb-4" id="createCourseForm">
                <div className="card card-body">
                    <h5 className="card-title">Add New Course</h5>
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
                                rows="3"
                                value={newCourseDesc}
                                onChange={(e) => setNewCourseDesc(e.target.value)}
                            ></textarea>
                        </div>
                        <button type="submit" className="btn btn-success">Save Course</button>
                    </form>
                </div>
            </div>

            {/* Courses List */}
            <h3>My Courses</h3>
            {loading ? (
                <p>Loading courses...</p>
            ) : courses.length === 0 ? (
                <div className="alert alert-info">You haven't created any courses yet.</div>
            ) : (
                <div className="row">
                    {courses.map((course) => (
                        <div key={course.id} className="col-md-4 mb-4">
                            <div className="card h-100">
                                <div className="card-body">
                                    <h5 className="card-title">{course.title}</h5>
                                    <p className="card-text">{course.description || 'No description provided.'}</p>
                                </div>
                                <div className="card-footer d-flex justify-content-between">
                                    <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => window.location.href = `/instructor/course/${course.id}`} // Using location for simplicity, or useLink/useNavigate
                                    >
                                        Manage Lessons
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleDeleteCourse(course.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
};

export default InstructorDashboard;
