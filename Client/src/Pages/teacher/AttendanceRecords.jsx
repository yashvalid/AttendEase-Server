import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { toast } from 'react-hot-toast';

const AttendanceRecords = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const response = await api.get('/event/get_all_rec');
                setRecords(response.data.all_attd || []);
            } catch (error) {
                // console.error(error);
                // toast.error('Failed to fetch attendance records'); // API might return 400 if no records
            } finally {
                setLoading(false);
            }
        };
        fetchRecords();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Attendance Records</h1>

            <Card>
                <CardHeader>
                    <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : records.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">No attendance records found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3">Student</th>
                                        <th className="px-6 py-3">Event ID</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((rec, i) => (
                                        <tr key={i} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {rec.student_id} {/* Ideally populate student name */}
                                            </td>
                                            <td className="px-6 py-4">{rec.event_id}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${rec.status === 'present' ? 'bg-green-100 text-green-800' :
                                                        rec.status === 'absent' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {rec.status || 'Present'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {new Date(rec.timestamp || Date.now()).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AttendanceRecords;
