const API_BASE_URL = 'http://localhost:5000/api';

export const api = {
    createParticipant: async () => {
        const response = await fetch(`${API_BASE_URL}/participants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Server error: ${response.status}`);
        }
        return response.json();
    },

    updateParticipant: async (participantId, data) => {
        const response = await fetch(`${API_BASE_URL}/participants/${participantId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(trialData)
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Server error: ${response.status}`);
        }
        return response.json();
    }
};
