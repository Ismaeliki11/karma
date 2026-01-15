
async function testApi() {
    const url = 'http://localhost:3000/api/availability?date=2026-01-14&serviceId=manicura-tradicional';
    console.log('Fetching:', url);
    try {
        const res = await fetch(url);
        console.log('Status:', res.status, res.statusText);
        const text = await res.text();
        console.log('Body:', text);
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

testApi();
