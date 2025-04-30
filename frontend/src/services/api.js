// Centralized API utility for frontend
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
