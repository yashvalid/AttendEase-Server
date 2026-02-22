import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const StudentEnrolledClasses = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/user/enrolled-classes');
            setClasses(response.data.classes || []);
        } catch (error) {
            toast.error('Failed to fetch enrolled classes');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Enrolled Classes</h1>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : classes.length === 0 ? (
                <Card className="p-10 text-center text-gray-500">
                    <p>You haven't enrolled in any classes yet.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <Card key={cls._id || cls.class_id} className="bg-primary-50 border-primary-100">
                            <CardHeader>
                                <CardTitle className="text-primary-900">{cls.class_name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-primary-700">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <span className="font-medium">Enrolled</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentEnrolledClasses;
