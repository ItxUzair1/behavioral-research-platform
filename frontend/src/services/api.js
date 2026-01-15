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
    },

    getStimulus: async (type, variant) => {
        const response = await fetch(`${API_BASE_URL}/tasks/stimulus?type=${type}&variant=${variant}`);
        if (!response.ok) throw new Error("Failed to fetch stimulus");
        return response.json();
    },

    submitTaskResult: async (data) => {
        const response = await fetch(`${API_BASE_URL}/tasks/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to submit result");
        return response.json();
    },

    startTask: async (participantId, taskType, condition, variant) => {
        const response = await fetch(`${API_BASE_URL}/tasks/start-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participantId, taskType, condition, variant })
        });
        if (!response.ok) throw new Error("Failed to start task");
        return response.json();
    },

    getEarnings: async (participantId) => {
        const response = await fetch(`${API_BASE_URL}/tasks/earnings?participantId=${participantId}`);
        if (!response.ok) throw new Error("Failed to get earnings");
        return response.json();
    }
};
