import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    BookOpen,
    CalendarCheck,
    LogOut,
    UserCircle,
    PlusCircle,
    List
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { UserDataContext } from '../../context/UserContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { userData } = useContext(UserDataContext);

    const teacherLinks = [
        { to: '/teacher', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/teacher/create-class', icon: PlusCircle, label: 'Create Class' },
        { to: '/teacher/classes', icon: BookOpen, label: 'My Classes' },
        { to: '/teacher/records', icon: List, label: 'Attendance Records' },
    ];

    const studentLinks = [
        { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/student/available', icon: BookOpen, label: 'Available Classes' },
        { to: '/student/enrolled', icon: CalendarCheck, label: 'Enrolled Classes' },
        { to: '/student/history', icon: List, label: 'My History' },
    ];

    const links = userData?.role === 'teacher' ? teacherLinks : studentLinks;

    return (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out hidden md:flex flex-col">
            <div className="flex h-16 items-center border-b border-gray-200 px-6">
                <div className="flex items-center gap-2 font-bold text-xl text-primary-600">
                    <CalendarCheck className="h-6 w-6" />
                    <span>Attendify</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-3">
                <nav className="space-y-1">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.end}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                                    isActive
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                )
                            }
                        >
                            <link.icon className="h-5 w-5" />
                            {link.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="border-t border-gray-200 p-4">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                        <UserCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{user?.email}</p>
                        <p className="truncate text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
