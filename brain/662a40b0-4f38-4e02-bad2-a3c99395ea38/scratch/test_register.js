const axios = require('axios');

async function testRegistration() {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'Test User',
            email: `test_${Date.now()}@example.com`,
            password: 'Password123!'
        });
        console.log('Registration Success:', response.data);
    } catch (error) {
        console.error('Registration Failed:', error.response?.data || error.message);
    }
}

testRegistration();
