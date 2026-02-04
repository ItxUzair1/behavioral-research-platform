import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Download, LogOut, Users, CheckCircle, Clock, FileText, AlertTriangle } from 'lucide-react';

export const AdminDashboard = ({ token, onLogout }) => {
    const [participants, setParticipants] = useState([]);
    const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [viewMode, setViewMode] = useState('participants'); // 'participants' or 'payouts'
    const [payoutFilter, setPayoutFilter] = useState('All'); // 'All', 'Pending', 'Paid', 'Not Requested'
    const [methodFilter, setMethodFilter] = useState('All'); // 'All', 'PayPal', 'Amazon Gift Card'
    const [processingId, setProcessingId] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]); // For bulk actions
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info', // 'info', 'warning', 'danger'
        onConfirm: () => { }
    });

    const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/['";]/g, '');

    const fetchParticipants = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/participants`, {
                headers: {
                    'x-admin-auth': token,
                    'ngrok-skip-browser-warning': 'true'
                }
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
                headers: {
                    'x-admin-auth': token,
                    'ngrok-skip-browser-warning': 'true'
                }
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

    const handleMarkAsPaid = async (pid) => {
        setConfirmationModal({
            isOpen: true,
            title: 'Confirm Payment',
            message: `Are you sure you want to mark participant ${pid} as paid? This cannot be undone.`,
            type: 'warning',
            onConfirm: () => executeMarkAsPaid(pid)
        });
    };

    const executeMarkAsPaid = async (pid) => {
        setProcessingId(pid);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/mark-paid`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-auth': token,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ participantId: pid })
            });
            const data = await res.json();
            if (data.success) {
                // Update local state
                setParticipants(prev => prev.map(p => {
                    if (p.participantId === pid) {
                        return { ...p, payoutInfo: { ...p.payoutInfo, status: 'Paid', paidAt: new Date() } };
                    }
                    return p;
                }));
            } else {
                alert("Failed to mark as paid: " + data.message);
            }
        } catch (err) {
            console.error(err);
            alert("Error marking as paid");
        } finally {
            setProcessingId(null);
            closeConfirmation();
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
                                <strong>Payout Status:</strong> <br />
                                {p.payoutInfo ? (
                                    <span className={p.payoutInfo.status === 'Paid' ? 'text-green-600 font-bold' : 'text-yellow-600 font-bold'}>
                                        {p.payoutInfo.status}
                                    </span>
                                ) : 'Not Requested'}
                                {p.payoutInfo?.email && <><br />Email: {p.payoutInfo.email}</>}
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

    // Filter for payouts view
    const payoutParticipants = participants.filter(p => {
        const isEligible = p.earnings > 0 || p.status === 'Completed';
        if (!isEligible) return false;

        if (payoutFilter !== 'All') {
            const status = p.payoutInfo?.status || 'Not Requested';
            if (status !== payoutFilter) return false;
        }

        if (methodFilter !== 'All') {
            const method = p.payoutInfo?.paymentMethod || 'PayPal'; // Default to PayPal if undefined but eligible
            if (method !== methodFilter) return false;
        }

        return true;
    });

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(payoutParticipants.map(p => p.participantId));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleBulkMarkAsPaid = async () => {
        setConfirmationModal({
            isOpen: true,
            title: 'Confirm Bulk Payment',
            message: `Are you sure you want to mark ${selectedIds.length} participants as paid? This action will update their status immediately.`,
            type: 'warning',
            onConfirm: () => executeBulkMarkAsPaid()
        });
    };

    const executeBulkMarkAsPaid = async () => {
        setIsBulkProcessing(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/mark-paid-bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-auth': token,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ participantIds: selectedIds })
            });
            const data = await res.json();
            if (data.success) {
                // Update local status
                setParticipants(prev => prev.map(p => {
                    if (selectedIds.includes(p.participantId)) {
                        return {
                            ...p,
                            payoutInfo: { ...p.payoutInfo, status: 'Paid', paidAt: new Date() }
                        };
                    }
                    return p;
                }));
                setSelectedIds([]);
                // Optional: Success modal? For now just alert or silent update
            } else {
                alert("Bulk update failed: " + data.message);
            }
        } catch (err) {
            console.error(err);
            alert("Error processing bulk update");
        } finally {
            setIsBulkProcessing(false);
            closeConfirmation();
        }
    };

    const closeConfirmation = () => {
        setConfirmationModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleDownloadPayoutCSV = () => {
        // Generate CSV content for selected (or all filtered if none selected? let's stick to selected)
        // If none selected, download all currently visible in payoutParticipants
        const targetList = selectedIds.length > 0
            ? payoutParticipants.filter(p => selectedIds.includes(p.participantId))
            : payoutParticipants;

        if (targetList.length === 0) {
            alert("No participants to export.");
            return;
        }

        const headers = ["ParticipantID", "Email", "Method", "Amount", "Status"];
        const rows = targetList.map(p => [
            p.participantId,
            p.payoutInfo?.email || '',
            p.payoutInfo?.paymentMethod || 'PayPal',
            p.earnings?.toFixed(2) || '0.00',
            p.payoutInfo?.status || 'Not Requested'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `payout_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-gray-100 pb-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setViewMode('participants')}
                                    className={`pb-2 font-bold transition-colors ${viewMode === 'participants' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    All Participants
                                </button>
                                <button
                                    onClick={() => setViewMode('payouts')}
                                    className={`pb-2 font-bold transition-colors ${viewMode === 'payouts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Payouts
                                </button>
                            </div>

                            {viewMode === 'payouts' && (
                                <div className="flex bg-gray-100 p-1 rounded-lg self-start">
                                    {['All', 'Pending', 'Paid', 'Not Requested'].map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => setPayoutFilter(filter)}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${payoutFilter === filter
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {viewMode === 'payouts' && (
                                <div className="flex bg-gray-100 p-1 rounded-lg self-start">
                                    {['All', 'PayPal', 'Amazon Gift Card'].map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => setMethodFilter(filter)}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${methodFilter === filter
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                        >
                                            {filter === 'Amazon Gift Card' ? 'Amazon' : filter}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {viewMode === 'payouts' && (
                                <>
                                    <Button onClick={handleDownloadPayoutCSV} disabled={payoutParticipants.length === 0} variant="secondary">
                                        <FileText className="w-4 h-4 mr-2" />
                                        {selectedIds.length > 0 ? `Export (${selectedIds.length})` : 'Export All Visible'}
                                    </Button>
                                    {selectedIds.length > 0 && (
                                        <Button onClick={handleBulkMarkAsPaid} disabled={isBulkProcessing} className="bg-green-600 hover:bg-green-700 text-white">
                                            {isBulkProcessing ? 'Processing...' : `Mark ${selectedIds.length} Paid`}
                                        </Button>
                                    )}
                                </>
                            )}
                            <Button onClick={handleDownloadFull} className="w-full md:w-auto">
                                <FileText className="w-4 h-4 mr-2" /> Download Full Data
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {viewMode === 'participants' ? (
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
                        ) : (
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50 text-gray-900 font-semibold uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="p-4 rounded-tl-lg w-10">
                                            <input
                                                type="checkbox"
                                                onChange={handleSelectAll}
                                                checked={payoutParticipants.length > 0 && selectedIds.length === payoutParticipants.length}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </th>
                                        <th className="p-4">ID</th>
                                        <th className="p-4">Earnings</th>
                                        <th className="p-4">Method</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 rounded-tr-lg text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {payoutParticipants.map((p) => (
                                        <tr key={p.participantId} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(p.participantId) ? 'bg-blue-50' : ''}`}>
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(p.participantId)}
                                                    onChange={() => handleSelectOne(p.participantId)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="p-4 font-mono text-gray-900 font-medium">{p.participantId}</td>
                                            <td className="p-4 font-bold text-gray-900">${p.earnings?.toFixed(2)}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${p.payoutInfo?.paymentMethod === 'Amazon Gift Card'
                                                    ? 'bg-orange-50 text-orange-700 border border-orange-100'
                                                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                                                    }`}>
                                                    {p.payoutInfo?.paymentMethod === 'Amazon Gift Card' ? 'Amazon' : 'PayPal'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {p.payoutInfo?.email ? (
                                                    <span className="font-mono bg-gray-50 text-gray-700 px-2 py-1 rounded select-all">
                                                        {p.payoutInfo.email}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic">Not provided</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.payoutInfo?.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                                    p.payoutInfo?.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {p.payoutInfo?.status || 'Not Requested'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {p.payoutInfo?.status === 'Pending' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleMarkAsPaid(p.participantId)}
                                                        disabled={processingId === p.participantId}
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        {processingId === p.participantId ? 'Processing...' : 'Mark Paid'}
                                                    </Button>

                                                )}
                                                {p.payoutInfo?.status === 'Paid' && (
                                                    <span className="text-green-600 text-xs font-bold uppercase tracking-wide">Paid ✓</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {payoutParticipants.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-gray-400 italic">
                                                No pending or eligible payouts found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Card>
            </div>

            <Modal
                isOpen={confirmationModal.isOpen}
                onClose={closeConfirmation}
                title={confirmationModal.title}
                footer={
                    <>
                        <Button variant="ghost" onClick={closeConfirmation}>Cancel</Button>
                        <Button
                            variant={confirmationModal.type === 'danger' ? 'danger' : 'primary'}
                            onClick={confirmationModal.onConfirm}
                        >
                            Confirm
                        </Button>
                    </>
                }
            >
                <div className="flex items-start gap-4">
                    {confirmationModal.type === 'warning' && (
                        <div className="bg-yellow-100 p-2 rounded-full text-yellow-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    )}
                    <p className="text-gray-600 mt-1">{confirmationModal.message}</p>
                </div>
            </Modal>
        </div>
    );
};
