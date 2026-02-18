import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthProvider';
import DashboardLayout from '../components/DashboardLayout';

const StudentCourseView = () => {
    const { courseId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && courseId) {
            fetchCourseContent();
        }
    }, [user, courseId]);

    const fetchCourseContent = async () => {
        setLoading(true);
        try {
            // Check Enrollment first (Optional security check, but good UI practice)
            const { data: enrollment, error: enrollError } = await supabase
                .from('enrollments')
                .select('*')
                .eq('student_id', user.id)
                .eq('course_id', courseId)
                .single();

            if (enrollError || !enrollment) {
                alert("You are not enrolled in this course.");
                navigate('/student');
                return;
            }

            // Fetch Course Details
            const { data: courseData, error: courseError } = await supabase
                .from('courses')
                .select('*, profiles!courses_instructor_id_fkey(name)')
                .eq('id', courseId)
                .single();

            if (courseError) throw courseError;
            setCourse(courseData);

            // Fetch Lessons
            const { data: lessonsData, error: lessonsError } = await supabase
                .from('lessons')
                .select('*')
                .eq('course_id', courseId)
                .order('id', { ascending: true });

            if (lessonsError) throw lessonsError;
            setLessons(lessonsData || []);

        } catch (error) {
            console.error('Error fetching course content:', error.message);
            navigate('/student');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <DashboardLayout>Loading content...</DashboardLayout>;
    if (!course) return <DashboardLayout>Course not found.</DashboardLayout>;

    return (
        <DashboardLayout title={course.title}>
            <div className="mb-4">
                <button className="btn btn-outline-secondary btn-sm mb-3" onClick={() => navigate('/student')}>
                    &larr; Back to Dashboard
                </button>
                <h5>Instructor: {course.profiles?.name}</h5>
                <p className="lead">{course.description}</p>
            </div>

            <div className="card">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">Course Content</h5>
                </div>
                <div className="list-group list-group-flush">
                    {lessons.length === 0 ? (
                        <div className="list-group-item">No lessons available yet.</div>
                    ) : (
                        lessons.map(lesson => (
                            <div key={lesson.id} className="list-group-item">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h5 className="mb-1">{lesson.title}</h5>
                                        <span className={`badge ${lesson.type === 'video' ? 'bg-danger' :
                                            lesson.type === 'pdf' ? 'bg-warning text-dark' : 'bg-info'
                                            }`}>
                                            {lesson.type.toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        {lesson.file_url ? (
                                            <a
                                                href={lesson.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-sm btn-primary"
                                            >
                                                {lesson.type === 'pdf' ? 'Download / View PDF' : 'Open Link'}
                                            </a>
                                        ) : (
                                            <span className="text-muted">No content link</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentCourseView;
