import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Plus, Users, Calendar, Radio } from 'lucide-react';
import { toast } from 'react-hot-toast';
import StartAttendanceModal from '../../components/features/StartAttendanceModal';

const TeacherClasses = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/user/classes');
            setClasses(response.data.classes || []);
        } catch (error) {
            console.error("Fetch classes error:", error);
            toast.error('Failed to fetch classes');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (classId) => {
        setSelectedClassId(classId);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center content-center">
                <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
                <Link to="/teacher/create-class">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Class
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-10 flex justify-center"><plus className="animate-spin h-8 w-8 text-primary-500" /></div>
            ) : classes.length === 0 ? (
                <Card className="p-10 text-center text-gray-500">
                    <p>No classes found. Create your first class to get started.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <Card key={cls._id || cls.class_id} className="hover:shadow-md transition-shadow flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-start">
                                    <span className="truncate pr-2" title={cls.class_name}>{cls.class_name}</span>
                                    <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 shrink-0">
                                        {cls.year}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="space-y-2 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        <span>{cls.student_count || 0} Students</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>Created: {new Date().toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                                <Button variant="outline" className="w-full">
                                    Details
                                </Button>
                                <Button className="w-full" onClick={() => handleOpenModal(cls._id || cls.class_id)}>
                                    <Radio className="h-4 w-4 mr-2" />
                                    Start
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <StartAttendanceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                classId={selectedClassId}
            />
        </div>
    );
};

export default TeacherClasses;
