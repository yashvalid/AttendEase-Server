import React, { useContext } from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StudentAttendanceListener from '../features/StudentAttendanceListener';
import { UserDataContext } from '../../context/UserContext';

const DashboardLayout = () => {
    const { userData } = useContext(UserDataContext);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />
            <main className="flex-1 md:ml-64 min-h-screen transition-all">
                <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                    <Outlet />
                </div>
            </main>

            {/* Include Listener if user is student */}
            {userData?.role === 'student' && <StudentAttendanceListener />}
        </div>
    );
};

export default DashboardLayout;
