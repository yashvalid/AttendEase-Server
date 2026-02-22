import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

const StudentHistory = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const response = await api.get('/event/get_recs');
                setRecords(response.data.recs || []);
            } catch (error) {
                // Ignore error if no records
            } finally {
                setLoading(false);
            }
        };
        fetchRecords();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">My Attendance History</h1>

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
                                        <th className="px-6 py-3">Event</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((rec, i) => (
                                        <tr key={i} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {rec.event_id || 'Class Event'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                                                    Present
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {new Date(rec.created_at || Date.now()).toLocaleDateString()}
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

export default StudentHistory;
