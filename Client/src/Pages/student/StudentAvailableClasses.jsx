import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { BookOpen, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';

const StudentAvailableClasses = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(null);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/user/student/classes');
            setClasses(response.data.classes || []);
        } catch (error) {
            toast.error('Failed to fetch available classes');
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (classId, year) => {
        setEnrolling(classId);
        try {
            await api.post('/user/add_class', { class_id: classId, year });
            toast.success('Enrolled successfully!');
            // Update list to remove enrolled class or mark as enrolled
            // For now, re-fetch or filter
            setClasses(classes.filter(c => c._id !== classId && c.class_id !== classId));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Enrollment failed');
        } finally {
            setEnrolling(null);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Available Classes</h1>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : classes.length === 0 ? (
                <Card className="p-10 text-center text-gray-500">
                    <p>No new classes available for your department/year.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <Card key={cls._id || cls.class_id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle>{cls.class_name}</CardTitle>
                                <span className="text-xs text-gray-500">{cls.year}</span>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500">
                                    <BookOpen className="inline-block h-4 w-4 mr-2" />
                                    Dep: {cls.dep || 'General'}
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    onClick={() => handleEnroll(cls._id || cls.class_id, cls.year)}
                                    isLoading={enrolling === (cls._id || cls.class_id)}
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Enroll
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentAvailableClasses;
