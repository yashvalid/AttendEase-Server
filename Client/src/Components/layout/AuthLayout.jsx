import React from 'react';
import { Outlet } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';

const AuthLayout = () => {
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Side - Form */}
            <div className="flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-8">
                    <div className="flex items-center gap-2 font-bold text-2xl text-primary-600 mb-8">
                        <CalendarCheck className="h-8 w-8" />
                        <span>Attendify</span>
                    </div>
                    <Outlet />
                </div>
            </div>

            {/* Right Side - Decor */}
            <div className="hidden lg:flex flex-col justify-center items-center bg-primary-50 p-12 text-center">
                <div className="max-w-xl space-y-6">
                    <h1 className="text-4xl font-bold text-primary-900">
                        Smart Attendance Management for Modern Education
                    </h1>
                    <p className="text-lg text-primary-700">
                        Streamline your class attendance with real-time tracking, geolocation verification, and instant analytics.
                    </p>
                    {/* You could add an illustration image here */}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
