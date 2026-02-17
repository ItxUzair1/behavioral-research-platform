const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/['";]/g, '');

const HEADERS = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
};

export const api = {
    createParticipant: async () => {
        const response = await fetch(`${API_BASE_URL}/participants`, {
            method: 'POST',
            headers: HEADERS
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Server error: ${response.status}`);
        }
        return response.json();
    },

    validateParticipant: async (participantId) => {
        const response = await fetch(`${API_BASE_URL}/participants/validate`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({ participantId })
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to validate participant');
        }
        return response.json();
    },

    getParticipant: async (participantId) => {
        const response = await fetch(`${API_BASE_URL}/participants/${participantId}`, { headers: HEADERS });
        if (!response.ok) throw new Error("Failed to fetch participant");
        return response.json();
    },

    updateParticipant: async (participantId, data) => {
        const response = await fetch(`${API_BASE_URL}/participants/${participantId}`, {
            method: 'PATCH',
            headers: HEADERS,
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Server error: ${response.status}`);
        }
        return response.json();
    },

    logTrial: async (trialData) => {
        const response = await fetch(`${API_BASE_URL}/trials`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(trialData)
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Server error: ${response.status}`);
        }
        return response.json();
    },

    getStimulus: async (type, variant, batchSize = 1) => {
        const url = `${API_BASE_URL}/tasks/stimulus?type=${type}&variant=${variant}&batchSize=${batchSize}`;
        const response = await fetch(url, { headers: HEADERS });
        if (!response.ok) throw new Error("Failed to fetch stimulus");
        return response.json();
    },

    submitTaskResult: async (data) => {
        const response = await fetch(`${API_BASE_URL}/tasks/submit`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to submit result");
        return response.json();
    },

    startTask: async (participantId, taskType, condition, variant) => {
        const response = await fetch(`${API_BASE_URL}/tasks/start-task`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({ participantId, taskType, condition, variant })
        });
        if (!response.ok) throw new Error("Failed to start task");
        return response.json();
    },

    getEarnings: async (participantId) => {
        const response = await fetch(`${API_BASE_URL}/tasks/earnings?participantId=${participantId}`, { headers: HEADERS });
        if (!response.ok) throw new Error("Failed to get earnings");
        return response.json();
    },

    submitPayoutDetails: async (participantId, email, paymentMethod) => {
        const response = await fetch(`${API_BASE_URL}/participants/${participantId}/payout`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify({ email, paymentMethod })
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Server error: ${response.status}`);
        }
        return response.json();
    },

    markAsPaid: async (token, participantId) => {
        const response = await fetch(`${API_BASE_URL}/admin/mark-paid`, {
            method: 'POST',
            headers: { ...HEADERS, 'x-admin-auth': token },
            body: JSON.stringify({ participantId })
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Server error: ${response.status}`);
        }
        return response.json();
    },

    markAsPaidBulk: async (token, participantIds) => {
        const response = await fetch(`${API_BASE_URL}/admin/mark-paid-bulk`, {
            method: 'POST',
            headers: { ...HEADERS, 'x-admin-auth': token },
            body: JSON.stringify({ participantIds })
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Server error: ${response.status}`);
        }
        return response.json();
    }
};
