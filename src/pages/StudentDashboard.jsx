import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthProvider';
import DashboardLayout from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [enrollments, setEnrollments] = useState([]);
    const [availableCourses, setAvailableCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch My Enrollments
            const { data: enrolledData, error: enrollError } = await supabase
                .from('enrollments')
                .select('course_id, courses(*)')
                .eq('student_id', user.id);

            if (enrollError) throw enrollError;

            const myCourses = enrolledData.map(e => e.courses);
            setEnrollments(myCourses);

            // 2. Fetch All Courses (to filter available)
            const { data: allCourses, error: courseError } = await supabase
                .from('courses')
                .select('*, profiles!courses_instructor_id_fkey(name)') // Get instructor name using specific FK
                .order('title');

            if (courseError) throw courseError;

            // Filter out courses already enrolled AND not matching the student's program
            const enrolledIds = new Set(myCourses.map(c => c.id));

            // Get program from User Metadata (more reliable than profile for now)
            const studentProgram = user.user_metadata?.program || profile?.program;

            const available = allCourses.filter(c => {
                const isNotEnrolled = !enrolledIds.has(c.id);

                // STRICT FILTERING:
                // 1. If user has a program, ONLY show courses with exact title match.
                // 2. If user has NO program (legacy?), show nothing (or force update - but for now show nothing to be safe as per request).
                const matchesProgram = studentProgram ? c.title === studentProgram : false;

                return isNotEnrolled && matchesProgram;
            });
            setAvailableCourses(available);

        } catch (error) {
            console.error('Error fetching student data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (courseId) => {
        try {
            const { error } = await supabase
                .from('enrollments')
                .insert([{ student_id: user.id, course_id: courseId }]);

            if (error) throw error;

            alert('Enrolled successfully!');
            fetchData(); // Refresh lists
        } catch (error) {
            alert('Error enrolling: ' + error.message);
        }
    };

    return (
        <DashboardLayout title="Student Dashboard">
            {/* My Enrollments */}
            <h3 className="mb-3">My Enrollments</h3>
            {loading ? <p>Loading...</p> : (
                <div className="row mb-5">
                    {enrollments.length === 0 ? (
                        <p className="text-muted">You are not enrolled in any courses yet.</p>
                    ) : (
                        enrollments.map(course => (
                            <div key={course.id} className="col-md-4 mb-4">
                                <div className="card h-100 border-primary">
                                    <div className="card-body">
                                        <h5 className="card-title">{course.title}</h5>
                                        <p className="card-text text-truncate">{course.description}</p>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => navigate(`/student/course/${course.id}`)}
                                        >
                                            View Course
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <hr />

            {/* Available Courses */}
            <h3 className="mb-3">Available Courses</h3>
            {loading ? <p>Loading...</p> : (
                <div className="row">
                    {availableCourses.length === 0 ? (
                        <p className="text-muted">No other courses available.</p>
                    ) : (
                        availableCourses.map(course => (
                            <div key={course.id} className="col-md-4 mb-4">
                                <div className="card h-100">
                                    <div className="card-body">
                                        <h5 className="card-title">{course.title}</h5>
                                        <h6 className="card-subtitle mb-2 text-muted">
                                            Instructor: {course.profiles?.name || 'Unknown'}
                                        </h6>
                                        <p className="card-text">{course.description}</p>
                                    </div>
                                    <div className="card-footer bg-white border-top-0">
                                        <button
                                            className="btn btn-outline-success w-100"
                                            onClick={() => handleEnroll(course.id)}
                                        >
                                            Enroll Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </DashboardLayout>
    );
};

export default StudentDashboard;
