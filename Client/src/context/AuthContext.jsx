import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(false);

    // Initialize auth state from local storage or validate token
    useEffect(() => {
        if (token) {
            // Decode token or fetch user profile if endpoint exists
            // For now, we'll assume the token is valid and set a basic user object from storage if available
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const response = await api.post('/user/login', { email, password });
            const { token, user_id, role, message } = response.data;
            console.log(response.data);
            const userData = { id: user_id, role, email };

            setToken(token);
            setUser(userData);

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            toast.success(message || 'Login successful!');
            return { success: true, role };
        } catch (error) {
            console.log("Login error:", error);
            const msg = error.response?.data?.message || 'Login failed';
            toast.error(msg);
            return { success: false, message: msg };
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        setLoading(true);
        try {
            await api.post('/user/register', userData);
            toast.success('Registration successful! Please login.');
            return { success: true };
        } catch (error) {
            console.error("Registration error:", error);
            const msg = error.response?.data?.error || 'Registration failed';
            toast.error(msg);
            return { success: false, message: msg };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success('Logged out successfully');
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
