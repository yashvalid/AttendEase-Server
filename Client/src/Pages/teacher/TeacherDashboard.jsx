import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Users, BookOpen, CalendarCheck, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const TeacherDashboard = () => {
    // In a real app, fetch stats from API
    const stats = [
        { label: 'Total Classes', value: '12', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Total Students', value: '145', icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Attendance Sessions', value: '48', icon: CalendarCheck, color: 'text-purple-600', bg: 'bg-purple-100' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Welcome back, Professor.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Link to="/teacher/create-class">
                            <Button variant="outline" className="w-full justify-between h-auto py-4">
                                <span className="flex items-center gap-3">
                                    <BookOpen className="h-5 w-5 text-gray-500" />
                                    <span className="font-medium text-gray-900">Create New Class</span>
                                </span>
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                            </Button>
                        </Link>
                        <Link to="/teacher/classes">
                            <Button variant="outline" className="w-full justify-between h-auto py-4">
                                <span className="flex items-center gap-3">
                                    <CalendarCheck className="h-5 w-5 text-gray-500" />
                                    <span className="font-medium text-gray-900">Start Attendance</span>
                                </span>
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { action: 'Started attendance', target: 'Advanced Math', time: '2 hours ago' },
                                { action: 'Created new class', target: 'Physics 101', time: '5 hours ago' },
                                { action: 'Exported records', target: 'Chemistry Lab', time: '1 day ago' },
                            ].map((activity, i) => (
                                <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                                        <p className="text-xs text-gray-500">{activity.target}</p>
                                    </div>
                                    <span className="text-xs text-gray-400">{activity.time}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TeacherDashboard;
