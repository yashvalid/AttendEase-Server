import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const CreateClass = () => {
    const [formData, setFormData] = useState({
        class_name: '',
        year: '',
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post(`${import.meta.env.VITE_BASE_URL}/user/create_class`, formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            toast.success('Class created successfully!');
            navigate('/teacher/classes');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create class');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Class</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Class Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Class Name"
                            placeholder="e.g. Advanced Mathematics"
                            value={formData.class_name}
                            onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                            required
                        />

                        <Input
                            label="Year / Batch"
                            placeholder="e.g. 2024"
                            value={formData.year}
                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                            required
                        />

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/teacher/classes')}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={loading}>
                                Create Class
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateClass;
