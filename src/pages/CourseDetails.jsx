import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthProvider';
import DashboardLayout from '../components/DashboardLayout';

const CourseDetails = () => {
    const { courseId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);

    // Lesson Form
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [newLessonType, setNewLessonType] = useState('video'); // video, pdf, link
    const [newLessonUrl, setNewLessonUrl] = useState('');
    const [newLessonFile, setNewLessonFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [createError, setCreateError] = useState(null);

    useEffect(() => {
        if (user && courseId) {
            fetchCourseDetails();
        }
    }, [user, courseId]);

    const fetchCourseDetails = async () => {
        setLoading(true);
        try {
            // Fetch course
            const { data: courseData, error: courseError } = await supabase
                .from('courses')
                .select('*')
                .eq('id', courseId)
                .single();

            if (courseError) throw courseError;

            // Verify instructor ownership OR admin role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role_id, roles(name)')
                .eq('id', user.id)
                .single();

            const isInstructor = courseData.instructor_id === user.id;
            const isAdmin = profile?.roles?.name === 'admin';

            if (!isInstructor && !isAdmin) {
                alert("You don't have permission to view this course.");
                try {
                    // Try to navigate back to the appropriate dashboard
                    if (profile?.roles?.name === 'student') navigate('/student');
                    else if (profile?.roles?.name === 'instructor') navigate('/instructor');
                    else navigate('/');
                } catch (e) {
                    navigate('/');
                }
                return;
            }
            setCourse(courseData);

            // Fetch lessons
            const { data: lessonsData, error: lessonsError } = await supabase
                .from('lessons')
                .select('*')
                .eq('course_id', courseId)
                .order('id', { ascending: true }); // Ideally order by a sequence field

            if (lessonsError) throw lessonsError;
            setLessons(lessonsData || []);

        } catch (error) {
            console.error('Error:', error.message);
            alert('Error loading course details.');
            navigate('/instructor');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setNewLessonFile(e.target.files[0]);
        }
    };

    const handleAddLesson = async (e) => {
        e.preventDefault();
        setCreateError(null);
        setUploading(true);

        let finalUrl = newLessonUrl;

        try {
            // 1. Upload File if PDF
            if (newLessonType === 'pdf' && newLessonFile) {
                const fileExt = newLessonFile.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
                const filePath = `${courseId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('lessons')
                    .upload(filePath, newLessonFile);

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('lessons')
                    .getPublicUrl(filePath);

                finalUrl = publicUrl;
            } else if (newLessonType === 'pdf' && !newLessonFile) {
                throw new Error("Please select a PDF file to upload.");
            }

            // 2. Insert Lesson Record
            const { data, error } = await supabase
                .from('lessons')
                .insert([
                    {
                        course_id: courseId,
                        title: newLessonTitle,
                        type: newLessonType,
                        file_url: finalUrl,
                    },
                ])
                .select();

            if (error) throw error;

            setLessons([...lessons, ...data]);

            // Reset form
            setNewLessonTitle('');
            setNewLessonUrl('');
            setNewLessonFile(null);
            // document.getElementById('lessonFile').value = ''; // Reset file input manually if needed

        } catch (error) {
            setCreateError(error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (!window.confirm("Delete this lesson?")) return;

        try {
            const { error } = await supabase
                .from('lessons')
                .delete()
                .eq('id', lessonId);

            if (error) throw error;
            setLessons(lessons.filter(l => l.id !== lessonId));
        } catch (error) {
            alert("Error deleting lesson: " + error.message);
        }
    };

    if (loading) return <DashboardLayout>Loading...</DashboardLayout>;
    if (!course) return <DashboardLayout>Course not found.</DashboardLayout>;

    return (
        <DashboardLayout title={`Manage Course: ${course.title}`}>
            <div className="mb-4">
                <button className="btn btn-outline-secondary btn-sm mb-3" onClick={() => navigate(-1)}>
                    &larr; Back
                </button>
                <p className="lead">{course.description}</p>
            </div>

            <div className="row">
                {/* Left: Lessons List */}
                <div className="col-md-7">
                    <div className="card">
                        <div className="card-header bg-white">
                            <h5 className="mb-0">Lessons</h5>
                        </div>
                        <ul className="list-group list-group-flush">
                            {lessons.length === 0 ? (
                                <li className="list-group-item text-muted">No lessons yet. Add one!</li>
                            ) : (
                                lessons.map(lesson => (
                                    <li key={lesson.id} className="list-group-item d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong>{lesson.title}</strong>
                                            <span className={`badge ms-2 ${lesson.type === 'video' ? 'bg-danger' :
                                                lesson.type === 'pdf' ? 'bg-warning text-dark' : 'bg-info'
                                                }`}>
                                                {lesson.type}
                                            </span>
                                            <br />
                                            <small className="text-muted">
                                                <a href={lesson.file_url} target="_blank" rel="noopener noreferrer">View Content</a>
                                            </small>
                                        </div>
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleDeleteLesson(lesson.id)}
                                        >
                                            Delete
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>

                {/* Right: Add Lesson Form */}
                <div className="col-md-5">
                    <div className="card">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">Add New Lesson</h5>
                        </div>
                        <div className="card-body">
                            {createError && <div className="alert alert-danger">{createError}</div>}

                            <form onSubmit={handleAddLesson}>
                                <div className="mb-3">
                                    <label className="form-label">Lesson Title</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newLessonTitle}
                                        onChange={(e) => setNewLessonTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Type</label>
                                    <select
                                        className="form-select"
                                        value={newLessonType}
                                        onChange={(e) => setNewLessonType(e.target.value)}
                                    >
                                        <option value="video">YouTube Video</option>
                                        <option value="pdf">PDF Document</option>
                                        <option value="link">External Link</option>
                                    </select>
                                </div>

                                {newLessonType === 'pdf' ? (
                                    <div className="mb-3">
                                        <label className="form-label">Upload PDF</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept=".pdf"
                                            onChange={handleFileChange}
                                            required
                                        />
                                        <div className="form-text">File will be public.</div>
                                    </div>
                                ) : (
                                    <div className="mb-3">
                                        <label className="form-label">URL (YouTube/Link)</label>
                                        <input
                                            type="url"
                                            className="form-control"
                                            value={newLessonUrl}
                                            onChange={(e) => setNewLessonUrl(e.target.value)}
                                            placeholder="https://..."
                                            required
                                        />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={uploading}
                                >
                                    {uploading ? 'Uploading...' : 'Add Lesson'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CourseDetails;
