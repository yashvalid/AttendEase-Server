import React, { useEffect, useState, useContext } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { MapPin, BellRing, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { UserDataContext } from '../../context/UserContext';

const StudentAttendanceListener = () => {
    const { socket } = useSocket();
    const { userData } = useContext(UserDataContext);
    const [activeEvent, setActiveEvent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);

    useEffect(() => {
        if (!socket) return;

        // Listen for attendance events
        // Assuming backend emits 'attendance_started' to all students or specific rooms
        // We might need to join class rooms first, but let's assume global or user-specific emission for now
        socket.on('attendance_started', (data) => {
            console.log("Attendance started event:", data);
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <BellRing className="h-10 w-10 text-primary-500" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    Attendance Started!
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    {data.event_name || 'Class Attendance'} has begun. Mark your presence now!
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex border-l border-gray-200">
                        <button
                            onClick={() => {
                                setActiveEvent(data);
                                toast.dismiss(t.id);
                            }}
                            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            Mark Now
                        </button>
                    </div>
                </div>
            ), { duration: 10000 }); // Show for 10 seconds

            // Also set active event immediately if we want to show a modal
            setActiveEvent(data);
        });

        return () => {
            socket.off('attendance_started');
        };
    }, [socket]);

    const handleMarkAttendance = () => {
        setLocationLoading(true);
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported');
            setLocationLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                setLocationLoading(false);
                setLoading(true);
                try {
                    await api.post('/event/mark_attendance', {
                        event_id: activeEvent.event_id || activeEvent.insertId, // Adjust based on socket payload
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                    toast.success('Attendance Marked Successfully!');
                    setActiveEvent(null);
                } catch (error) {
                    console.error("Mark attendance error:", error);
                    const msg = error.response?.data?.message || 'Failed to mark attendance';
                    toast.error(msg);
                    // Don't close modal on error unless it's "Too late" or "Already marked"
                    if (msg.includes('late') || msg.includes('already')) {
                        setActiveEvent(null);
                    }
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                setLocationLoading(false);
                toast.error('Please allow location access to mark attendance');
            }
        );
    };

    if (!activeEvent) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                >
                    <div className="bg-primary-600 p-6 text-center text-white">
                        <BellRing className="h-12 w-12 mx-auto mb-3 animate-pulse" />
                        <h2 className="text-2xl font-bold">Attendance Active</h2>
                        <p className="opacity-90 mt-1">{activeEvent.event_name || 'Class Event'}</p>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <p className="text-gray-600">
                                Please ensure you are inside the classroom to mark your attendance.
                            </p>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                                <MapPin className="h-3 w-3" />
                                Location Check Required
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => setActiveEvent(null)}
                                disabled={loading}
                            >
                                Dismiss
                            </Button>
                            <Button
                                onClick={handleMarkAttendance}
                                isLoading={loading || locationLoading}
                                className="w-full"
                            >
                                {locationLoading ? 'Locating...' : 'Mark Present'}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default StudentAttendanceListener;
