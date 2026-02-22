import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated && user) {
            // Initialize socket connection
            const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
                query: {
                    userId: user.id || user._id, // Handle different ID formats if needed
                    role: user.role,
                },
            });

            setSocket(newSocket);

            // Startup listeners for connection status
            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            // Cleanup on unmount or user change
            return () => {
                newSocket.close();
            };
        } else {
            // Close socket if user logs out
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [isAuthenticated, user?.id]); // Re-run if user changes

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
