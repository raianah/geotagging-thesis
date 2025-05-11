// Centralized API utility for frontend
import axios from "axios";
const API_BASE = "http://localhost:3000";

function getToken() {
    return localStorage.getItem("authToken");
}

function getHeaders(isJson = true) {
    const headers = {};
    if (isJson) headers["Content-Type"] = "application/json";
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
}

export async function apiRequest(endpoint, method = "GET", data = null) {
    const options = {
        method,
        headers: getHeaders(),
    };
    if (data) {
        options.body = JSON.stringify(data);
    }
    const url = new URL(endpoint.startsWith("http://") || endpoint.startsWith("https://") ? endpoint : `${API_BASE}${endpoint}`);
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
    }
    try {
        return await response.json();
    } catch {
        return {};
    }
}

// Auth
export function login(email, password) {
    return apiRequest("/login", "POST", { email, password });
}

export function register(data) {
    return apiRequest("/register", "POST", data);
}

// Profile
export function getProfile() {
    return apiRequest("/profile", "GET");
}

export function updateProfile(data) {
    return apiRequest("/profile", "PUT", data);
}

// Accounts (admin/employee)
export function getAccounts() {
    return apiRequest("/accounts", "GET");
}

// Pending Accounts (employee dashboard)
export function getPendingAccounts() {
    return apiRequest("/pending-accounts", "GET");
}

// Update Account Status (accept/reject)
export function updateAccountStatus(uid, status) {
    return apiRequest(`/accounts/${uid}/status`, "PUT", { status });
}

export function updatePassword(uid, passwordData) {
    return apiRequest(`/accounts/${uid}/changePassword`, "PUT", { passwordData });

    // try {
    //     const token = localStorage.getItem('token'); // Assuming you store the auth token in localStorage

        
    //     const response = await axios({
    //         method: 'PUT',
    //         url: `${process.env.REACT_APP_API_URL}/api/users/password`,
    //         headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${token}`
    //         },
    //         data: {
    //         currentPassword: passwordData.currentPassword,
    //         newPassword: passwordData.newPassword
    //         }
    //     });
        
    //     // Return the data from the response
    //     return response.data;
    //     } catch (error) {
    //     if (error.response) {
    //         // web server responded with a status code outside the range of 2xx
    //         if (error.response.status === 401) {
    //             throw new Error('Current password is incorrect');
    //         } else if (error.response.status === 400) {
    //             throw new Error(error.response.data.message || 'Invalid password format');
    //         } else {
    //             throw new Error('Server error. Please try again later.');
    //         }
    //     } else if (error.request) {
    //         throw new Error('No response from server. Please check your connection.');
    //     } else {
    //         throw new Error('Failed to update password: ' + error.message);
    //     }
    // }
};

// Dashboard
export function getDashboardData() {
    return apiRequest("/dashboard-data", "GET");
}

// Hog Owners
export function getHogOwners() {
    return apiRequest("/hog-owners", "GET");
}

// Add Farm
export function addFarm(farmData) {
    return apiRequest("/farms", "POST", farmData);
}

// ASF Outbreak Reports
export function getAsfOutbreakReports() {
    return apiRequest("/asf-outbreak-reports", "GET");
}

export function addAsfOutbreakReport(data) {
    return apiRequest("/asf-outbreak-reports", "POST", data);
}
