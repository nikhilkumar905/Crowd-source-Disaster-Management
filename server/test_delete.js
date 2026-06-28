async function test() {
  try {
    const res = await fetch('http://localhost:5001/api/auth/login', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nikhilsah905@gmail.com', password: 'nikhil@2857' }) 
    });
    const data = await res.json();
    const token = data.token;
    console.log('Logged in as admin');

    const usersRes = await fetch('http://localhost:5001/api/users', { headers: { Authorization: `Bearer ${token}` } });
    const usersData = await usersRes.json();
    const users = usersData.users;
    console.log('Found users:', users.length);
    
    // Find a non-admin user to delete, or just create one and delete it
    const testUser = users.find(u => u.email === 'test_delete@test.com');
    let targetId;
    if (!testUser) {
        const createRes = await fetch('http://localhost:5001/api/auth/register', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test Del', email: 'test_delete@test.com', password: 'password123' }) 
        });
        const createData = await createRes.json();
        targetId = createData.user.id;
        console.log('Created test user:', targetId);
    } else {
        targetId = testUser._id;
    }

    const delRes = await fetch(`http://localhost:5001/api/users/${targetId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    console.log('Delete response:', await delRes.json());
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
