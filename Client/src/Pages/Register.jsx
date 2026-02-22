import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import axios from 'axios';
import toast from 'react-hot-toast';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student', // Default role
        year: '',
        dep: '',
    });
    const [errors, setErrors] = useState({});
    const { register, loading } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 7) newErrors.password = 'Password must be at least 7 characters';

        if (formData.role === 'student') {
            if (!formData.year) newErrors.year = 'Year is required';
            if (!formData.dep) newErrors.dep = 'Department is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        console.log(formData)
        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/user/register`, formData);
            console.log(response.data);

            if (response.status === 201) {
                toast.success('User registered successfully');
                navigate('/login');
            }
        } catch (error) {
            toast.error(error.response.data.message || 'User registration failed');
        }

        // const dataToSubmit = {
        //     ...formData,
        //     year: formData.role === 'student' ? [formData.year] : [], // API expects array for year? Based on doc: "year": ["string"]
        // };

        // const { success } = await register(dataToSubmit);
        // if (success) {
        //     navigate('/login');
        // }
    };

    return (
        <Card className="w-full border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Create an account</CardTitle>
                <CardDescription>Get started with Attendify today</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                        disabled={loading}
                    />
                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                        disabled={loading}
                    />
                    <Input
                        label="Password"
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                        disabled={loading}
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Role</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="role"
                                    value="student"
                                    checked={formData.role === 'student'}
                                    onChange={handleChange}
                                    className="text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700">Student</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="role"
                                    value="teacher"
                                    checked={formData.role === 'teacher'}
                                    onChange={handleChange}
                                    className="text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700">Teacher</span>
                            </label>
                        </div>
                    </div>

                    {formData.role === 'student' && (
                        <div className="grid grid-cols-2 gap-4">
                            <select
                                name="dep"
                                value={formData.dep}
                                onChange={handleChange}
                                disabled={loading}
                                className={`w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.dep ? 'border-red-500' : 'border-gray-300'}`}
                            >
                                <option value="">Select Dept</option>
                                <option value="BCA">BCA</option>
                                <option value="BBA">BBA</option>
                                <option value="BCOM">BCOM</option>
                            </select>
                            <select
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                disabled={loading}
                                className={`w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.year ? 'border-red-500' : 'border-gray-300'}`}
                            >
                                <option value="">Select Year</option>
                                <option value="fy">First Year</option>
                                <option value="sy">Second Year</option>
                                <option value="ty">Third Year</option>
                            </select>
                        </div>
                    )}

                    {formData.role === 'teacher' && (
                        <div className="grid grid-cols-2 gap-4">
                            <select
                                name="dep"
                                value={formData.dep}
                                onChange={handleChange}
                                disabled={loading}
                                className={`w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.dep ? 'border-red-500' : 'border-gray-300'}`}
                            >
                                <option value="">Select Dept</option>
                                <option value="BCA">BCA</option>
                                <option value="BBA">BBA</option>
                                <option value="BCOM">BCOM</option>
                            </select>


                            <div className="flex gap-2">
                                {[
                                    { id: 'fy', label: 'FY' },
                                    { id: 'sy', label: 'SY' },
                                    { id: 'ty', label: 'TY' },
                                ].map((year) => {
                                    const isSelected = Array.isArray(formData.year) && formData.year.includes(year.id);
                                    return (
                                        <button
                                            key={year.id}
                                            type="button"
                                            onClick={() => {
                                                const currentYears = Array.isArray(formData.year) ? formData.year : [];
                                                const newYears = isSelected
                                                    ? currentYears.filter((y) => y !== year.id)
                                                    : [...currentYears, year.id];
                                                handleChange({ target: { name: 'year', value: newYears } });
                                            }}
                                            disabled={loading}
                                            className={`flex-1 rounded-md border py-2 text-xs font-semibold transition-colors ${isSelected
                                                    ? 'bg-primary-600 text-white border-primary-600'
                                                    : 'bg-transparent text-gray-600 border-gray-300 hover:bg-gray-50'
                                                } ${errors.year ? 'border-red-500' : ''}`}
                                        >
                                            {year.label}
                                        </button>
                                    );
                                })}
                            </div>


                        </div>
                    )}

                    <Button type="submit" className="w-full" isLoading={loading}>
                        Create account
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary-600 hover:underline font-medium">
                        Sign in
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
};

export default Register;
