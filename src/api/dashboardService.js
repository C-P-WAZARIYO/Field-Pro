import api from './axios';

/**
 * Dashboard API Service
 * Handles all API communications for the Employee Dashboard
 */

// User & Profile
export const getUserProfile = async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data?.data?.user;
};

// Performance Metrics
export const getPerformanceMetrics = async (userId, timeframe = 'month') => {
    const response = await api.get(`/users/${userId}/performance-metrics`, {
        params: { timeframe }
    });
    return response.data?.data?.metrics;
};

export const getPerformanceByCategory = async (userId, groupBy = 'bankwise', viewType = 'count') => {
    const response = await api.get(`/users/${userId}/performance-breakdown`, {
        params: { groupBy, viewType }
    });
    return response.data?.data?.breakdown;
};

// Cases
export const getAssignedCases = async (userId) => {
    const response = await api.get(`/cases/assigned/${userId}`);
    return response.data?.data?.cases || [];
};

export const getCaseById = async (caseId) => {
    const response = await api.get(`/cases/${caseId}`);
    return response.data?.data?.case;
};

export const getCasesByStatus = async (userId, status) => {
    const response = await api.get(`/cases/assigned/${userId}`, {
        params: { status }
    });
    return response.data?.data?.cases || [];
};

export const getTodaysCases = async (userId) => {
    const response = await api.get(`/cases/assigned/${userId}/todays-tasks`);
    return response.data?.data?.cases || [];
};

// Feedback
export const submitFeedback = async (feedbackData) => {
    const formData = new FormData();
    
    // Append all fields
    Object.keys(feedbackData).forEach(key => {
        if (key !== 'photo') {
            formData.append(key, feedbackData[key]);
        }
    });

    // Append photo file if present
    if (feedbackData.photo) {
        formData.append('photo', feedbackData.photo);
    }

    const response = await api.post('/feedbacks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return response.data?.data?.feedback;
};

export const getFeedbackByCase = async (caseId) => {
    const response = await api.get(`/feedbacks/case/${caseId}`);
    return response.data?.data?.feedbacks || [];
};

export const getFeedbackByExecutive = async (userId) => {
    const response = await api.get(`/feedbacks/executive/${userId}`);
    return response.data?.data?.feedbacks || [];
};

// PTP (Promise to Pay) Alerts
export const getPTPAlerts = async () => {
    const response = await api.get('/feedbacks/alerts/ptp');
    return response.data?.data?.alerts || [];
};

export const getPTPAlertsByUser = async (userId) => {
    const response = await api.get(`/feedbacks/alerts/ptp/${userId}`);
    return response.data?.data?.alerts || [];
};

export const markPTPBroken = async (feedbackId) => {
    const response = await api.patch(`/feedbacks/${feedbackId}/ptp-broken`);
    return response.data?.data?.feedback;
};

export const updatePTPDate = async (feedbackId, ptpDate) => {
    const response = await api.patch(`/feedbacks/${feedbackId}/ptp-date`, {
        ptp_date: ptpDate
    });
    return response.data?.data?.feedback;
};

// Next Action Dates
export const getUpcomingActions = async (userId, daysAhead = 7) => {
    const response = await api.get(`/users/${userId}/upcoming-actions`, {
        params: { days: daysAhead }
    });
    return response.data?.data?.actions || [];
};

export const getTodaysActions = async (userId) => {
    const response = await api.get(`/users/${userId}/todays-actions`);
    return response.data?.data?.actions || [];
};

// Downloads
export const downloadCasesAsCSV = (cases, filename = 'cases.csv') => {
    const headers = ['Account ID', 'Customer Name', 'Phone', 'POS Amount', 'Bucket', 'Product', 'Bank', 'Address', 'Last Feedback'];
    const rows = cases.map(c => [
        c.acc_id,
        c.customer_name,
        c.phone_number,
        c.pos_amount,
        c.bkt,
        c.product_type,
        c.bank_name,
        c.address,
        c.feedbacks?.[0]?.remarks || 'No feedback'
    ]);

    const csv = [
        headers,
        ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const downloadVisitPlanAsCSV = (cases, filename = 'visit-plan.csv') => {
    const headers = ['Account ID', 'Customer Name', 'Next Action Date', 'Priority', 'Address', 'Phone', 'POS Amount'];
    const rows = cases
        .filter(c => c.feedbacks?.length > 0 && c.feedbacks[c.feedbacks.length - 1]?.ptp_date)
        .map(c => {
            const lastFeedback = c.feedbacks[c.feedbacks.length - 1];
            return [
                c.acc_id,
                c.customer_name,
                lastFeedback?.ptp_date ? new Date(lastFeedback.ptp_date).toLocaleDateString() : 'N/A',
                c.priority || 'Medium',
                c.address,
                c.phone_number,
                c.pos_amount
            ];
        });

    const csv = [
        headers,
        ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export default {
    getUserProfile,
    getPerformanceMetrics,
    getPerformanceByCategory,
    getAssignedCases,
    getCaseById,
    getCasesByStatus,
    getTodaysCases,
    submitFeedback,
    getFeedbackByCase,
    getFeedbackByExecutive,
    getPTPAlerts,
    getPTPAlertsByUser,
    markPTPBroken,
    updatePTPDate,
    getUpcomingActions,
    getTodaysActions,
    downloadCasesAsCSV,
    downloadVisitPlanAsCSV
};
