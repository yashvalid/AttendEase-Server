import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { BookOpen, CalendarCheck } from 'lucide-react';

const StudentDashboard = () => {
    // Placeholder stats
    const stats = [
        { label: 'Enrolled Classes', value: '5', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Attendance Rate', value: '92%', icon: CalendarCheck, color: 'text-green-600', bg: 'bg-green-100' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Track your attendance and classes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center bg-gradient-to-br from-primary-50 to-white">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Ready for class?</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Waiting for the teacher to start attendance? Keep this page open or browse other tabs. You'll get a notification when it starts.
                    </p>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 animate-pulse">
                        <CalendarCheck className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-green-600 mt-2">System Active</p>
                </div>

                <Card className="h-full">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Schedule</h3>
                        <div className="space-y-4">
                            {[
                                { subject: 'Data Structures', time: '10:00 AM', status: 'Completed' },
                                { subject: 'Database Management', time: '02:00 PM', status: 'Upcoming' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{item.subject}</p>
                                        <p className="text-xs text-gray-500">{item.time}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${item.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default StudentDashboard;
