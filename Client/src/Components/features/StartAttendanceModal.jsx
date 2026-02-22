import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MapPin, Loader2, X } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const StartAttendanceModal = ({ isOpen, onClose, classId }) => {
    const [eventName, setEventName] = useState('');
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [location, setLocation] = useState(null);

    if (!isOpen) return null;

    const getLocation = () => {
        setLocationLoading(true);
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            setLocationLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLocationLoading(false);
                toast.success('Location acquired!');
            },
            (error) => {
                console.error("Location error:", error);
                toast.error('Unable to retrieve your location');
                setLocationLoading(false);
            }
        );
    };

    const handleStart = async () => {
        if (!location) {
            toast.error('Please enable location services first');
            return;
        }

        setLoading(true);
        try {
            await api.post('/event/attendance', {
                class_id: classId,
                event_name: eventName || 'Daily Attendance',
                latitude: location.latitude,
                longitude: location.longitude,
            });
            toast.success('Attendance event started!');
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to start attendance');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900">Start Attendance</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <Input
                        label="Event Name (Optional)"
                        placeholder="e.g. Lecture 5"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                    />

                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${location ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                <MapPin className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                                {location ? 'Location acquired' : 'Location required'}
                            </span>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={getLocation}
                            isLoading={locationLoading}
                            disabled={location}
                        >
                            {location ? 'Updated' : 'Get Location'}
                        </Button>
                    </div>

                    <div className="text-xs text-gray-500">
                        Students must be within 10 meters of your current location to mark their attendance.
                    </div>
                </div>

                <div className="p-6 bg-gray-50 flex gap-3 justify-end">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleStart} isLoading={loading} disabled={!location}>
                        Start Attendance
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default StartAttendanceModal;
