import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Download, LogOut, Users, CheckCircle, Clock, FileText } from 'lucide-react';

export const AdminDashboard = ({ token, onLogout }) => {
    const [participants, setParticipants] = useState([]);
    const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedParticipant, setSelectedParticipant] = useState(null);

    const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/['";]/g, '');

    const fetchParticipants = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/participants`, {
                headers: { 'x-admin-auth': token }
            });
            const data = await res.json();
            if (data.success) {
                setParticipants(data.participants);
                const total = data.participants.length;
                const completed = data.participants.filter(p => p.status === 'Completed').length;
                setStats({
                    total,
                    completed,
                    inProgress: total - completed
                });
            }
        } catch (err) {
            console.error("Failed to load participants", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParticipants();
    }, [token]);

    const handleDownloadFull = () => {
        downloadWithAuth(`${API_BASE_URL}/admin/export/full`, 'Full_Export.csv');
    };

    const handleDownloadParticipant = (pid) => {
        downloadWithAuth(`${API_BASE_URL}/admin/export/${pid}`, `Participant_${pid}_Raw.csv`);
    };

    const downloadWithAuth = async (url, filename) => {
        try {
            const res = await fetch(url, {
                headers: { 'x-admin-auth': token }
            });
            if (!res.ok) throw new Error("Download failed");
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename; // The backend sets this usually via Content-Disposition but we can fallback
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            alert("Download failed. Check console.");
            console.error(err);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Dashboard...</div>;

    if (selectedParticipant) {
        // Simple detail view overlay or separate section
        // For requirements, "Individual Participant View"
        const p = participants.find(x => x.participantId === selectedParticipant);
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Button variant="ghost" onClick={() => setSelectedParticipant(null)}>← Back to Dashboard</Button>
                    <Card>
                        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Participant {p.participantId}</h2>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${p.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {p.status}
                                </span>
                            </div>
                            <Button onClick={() => handleDownloadParticipant(p.participantId)} className="w-full md:w-auto">
                                <Download className="w-4 h-4 mr-2" /> Download Raw Data
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="p-4 bg-gray-50 rounded text-gray-700">
                                <strong>Condition Order:</strong> <br /> {p.conditionOrder}
                            </div>
                            <div className="p-4 bg-gray-50 rounded text-gray-700">
                                <strong>Current Step:</strong> <br /> {p.currentStep}
                            </div>
                            <div className="p-4 bg-gray-50 rounded text-gray-700">
                                <strong>Earnings:</strong> <br /> ${p.earnings?.toFixed(2)}
                            </div>
                            <div className="p-4 bg-gray-50 rounded text-gray-700">
                                <strong>Timestamps:</strong> <br />
                                Started: {p.startedAt ? new Date(p.startedAt).toLocaleString() : 'N/A'} <br />
                                Completed: {p.completedAt ? new Date(p.completedAt).toLocaleString() : 'N/A'}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <Button variant="secondary" onClick={onLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full md:w-auto">
                        <LogOut className="w-4 h-4 mr-2" /> Logout
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Participants</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Completed</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">In Progress</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <Card className="overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                        <Button onClick={handleDownloadFull} className="w-full md:w-auto">
                            <FileText className="w-4 h-4 mr-2" /> Download Full Dataset (CSV)
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-900 font-semibold uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="p-4 rounded-tl-lg">ID</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Condition Order</th>
                                    <th className="p-4">Completed At</th>
                                    <th className="p-4 rounded-tr-lg text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {participants.map((p) => (
                                    <tr key={p.participantId} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-mono text-gray-900 font-medium">{p.participantId}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="p-4 truncate max-w-xs">{p.conditionOrder}</td>
                                        <td className="p-4 text-gray-500">
                                            {p.completedAt ? new Date(p.completedAt).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedParticipant(p.participantId)}>
                                                View Details
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {participants.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-400 italic">
                                            No participants found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};
