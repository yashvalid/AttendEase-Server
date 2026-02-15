const BASE_URL = 'http://localhost:3000/api';
const email = `t${Date.now().toString().slice(-4)}@t.com`;
const password = 'password123';

async function verify() {
    console.log(`Testing with email: ${email}`);

    // 1. Register
    try {
        const regRes = await fetch(`${BASE_URL}/user/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Teacher',
                email,
                password,
                role: 'teacher'
            })
        });
        const regData = await regRes.json();
        console.log('Register Status:', regRes.status);
        console.log('Register Response:', regData);
        if (!regRes.ok) throw new Error('Registration failed');
    } catch (err) {
        console.error('Registration Error:', err);
        process.exit(1);
    }

    // 2. Login
    let token;
    try {
        const loginRes = await fetch(`${BASE_URL}/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        console.log('Login Status:', loginRes.status);
        if (!loginRes.ok) throw new Error('Login failed');
        token = loginData.token;
        console.log('Token received');
    } catch (err) {
        console.error('Login Error:', err);
        process.exit(1);
    }

    // 3. Create Class
    try {
        const classRes = await fetch(`${BASE_URL}/user/create_class`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ class_name: 'Test Class 101' })
        });
        const classData = await classRes.json();
        console.log('Create Class Status:', classRes.status);
        console.log('Create Class Response:', classData);
        if (!classRes.ok) throw new Error('Create Class failed');
    } catch (err) {
        console.error('Create Class Error:', err);
        process.exit(1);
    }

    // 4. Get Classes
    try {
        const getRes = await fetch(`${BASE_URL}/user/classes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const getData = await getRes.json();
        console.log('Get Classes Status:', getRes.status);
        console.log('Classes:', getData.classes);
        if (!getRes.ok) throw new Error('Get Classes failed');
    } catch (err) {
        console.error('Get Classes Error:', err);
        process.exit(1);
    }

    console.log('Verification Complete!');
}

verify();
