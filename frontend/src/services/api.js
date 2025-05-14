// Centralized API utility for frontend
import axios from "axios";
const API_BASE = "http://localhost:3000";

function getToken() {
    const token = localStorage.getItem("authToken");
    console.log('Retrieved token:', token);
    return token;
}

function getHeaders(isJson = true, requireAuth = true) {
    const headers = {};
    if (isJson) headers["Content-Type"] = "application/json";
    if (requireAuth) {
        const token = getToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
            console.log('Setting auth header:', headers["Authorization"]);
        } else {
            console.log('No token available for auth');
        }
    }
    return headers;
}

export async function apiRequest(endpoint, method = "GET", data = null, requireAuth = true) {
    const url = endpoint.startsWith("http://") || endpoint.startsWith("https://") ? endpoint : `${API_BASE}${endpoint}`;
    
    try {
        const response = await axios({
            method,
            url,
            data: data ? JSON.stringify(data) : undefined,
            headers: getHeaders(true, requireAuth)
        });
        
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.error || error.response.statusText);
        }
        throw error;
    }
}

// Auth
export function login(email, password) {
    return apiRequest("/login", "POST", { email, password }, false)
        .then(response => {
            if (response.user && response.user.uid) {
                localStorage.setItem('userId', response.user.uid);
            }
            if (response.token) {
                localStorage.setItem('authToken', response.token);
            }
            return response;
        });
}

export function register(data) {
    return apiRequest("/register", "POST", data, false);
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

export function updatePassword(passwordData) {
    const uid = localStorage.getItem('userId'); // Get user ID from localStorage
    return apiRequest(`/accounts/${uid}/changePassword`, "PUT", passwordData);
}

export function deleteAccount() {
    const uid = localStorage.getItem('userId');
    return apiRequest(`/accounts/${uid}`, "DELETE");
}

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

// Get complete hog owner details
export function getHogOwnerDetails(uid) {
    if (!uid) {
        return Promise.reject(new Error('User ID is required'));
    }
    return apiRequest(`/hog-owner/${uid}`, "GET")
        .catch(error => {
            console.error('Error fetching hog owner details:', error);
            throw error;
        });
}

// Get verified hog owners' locations
export function getVerifiedHogOwners() {
    return apiRequest("/api/verified-hog-owners", "GET");
}
