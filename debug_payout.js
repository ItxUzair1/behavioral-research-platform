const API_URL = 'http://localhost:5000/api';
const ADMIN_TOKEN = Buffer.from('admin@123').toString('base64');

async function run() {
    try {
        console.log("1. Creating Participant...");
        const createRes = await fetch(`${API_URL}/participants`, { method: 'POST' });
        const createData = await createRes.json();
        const pid = createData.participantId;
        console.log(`   Created: ${pid}`);

        console.log("2. Submitting Payout Details...");
        const email = `test_${pid}@example.com`;
        const payoutRes = await fetch(`${API_URL}/participants/${pid}/payout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const payoutData = await payoutRes.json();
        console.log(`   Response:`, payoutData);

        if (!payoutData.success) {
            console.error("   Failed to submit payout!");
            return;
        }

        console.log("3. Checking Admin Dashboard...");
        const adminRes = await fetch(`${API_URL}/admin/participants`, {
            headers: { 'x-admin-auth': ADMIN_TOKEN }
        });
        const adminData = await adminRes.json();

        if (!adminData.success) {
            console.error("   Failed to fetch admin data!");
            return;
        }

        const participant = adminData.participants.find(p => p.participantId === pid);
        console.log("   Found Participant in Admin View:");
        console.log(JSON.stringify(participant, null, 2));

        if (participant.payoutInfo && participant.payoutInfo.email === email && participant.payoutInfo.status === 'Pending') {
            console.log("SUCCESS: Email and Status verified.");
        } else {
            console.error("FAILURE: Data mismatch or missing.");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

run();
