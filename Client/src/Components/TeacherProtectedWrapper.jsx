import React, { useContext, useEffect, useState } from 'react'
import { UserDataContext } from '../context/UserContext'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const TeacherProtectedWrapper = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true)
    const { userData, setUserData } = useContext(UserDataContext);
    const navigate = useNavigate()
    const token = localStorage.getItem('token');
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/user/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                console.log(response.data.user, response.status);
                if (response.status === 201) {
                    setUserData(response.data.user);
                    console.log(response.data.user);
                } else {
                    navigate("/login");
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
                navigate("/login");
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserData()
    }, [token])

    if (isLoading) {
        return (
            <h1>Loading</h1>
        )
    }
    return (
        <div>
            {children}
        </div>
    )
}

export default TeacherProtectedWrapper