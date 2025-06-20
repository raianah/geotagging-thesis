// Centralized API utility for frontend
import axios from "axios";
// const API_BASE = "https://blnbtg-backend.thetwlight.xyz";
const API_BASE = import.meta.env.VITE_API_BASE;

function getToken() {
    const token = localStorage.getItem("accessToken");
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

// Function to refresh access token
async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    try {
        const response = await axios.post(`${API_BASE}/refresh-token`, {
            refreshToken
        });
        
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        return accessToken;
    } catch (error) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        window.location.href = '/login';
        throw error;
    }
}

export async function apiRequest(endpoint, method = "GET", data = null, requireAuth = true) {
    const url = endpoint.startsWith("http://") || endpoint.startsWith("https://") ? endpoint : `${API_BASE}${endpoint}`;

    console.log(`Making ${method} request to: ${url}`);
    console.log('Request data:', data);
    
    try {
        const response = await axios({
            method,
            url,
            data: data || undefined,
            headers: getHeaders(true, requireAuth),
            timeout: 10000, // 10 seconds timeout
        });
        
        return response.data;
    } catch (error) {
        if (error.response) {
            // If token expired, try to refresh
            if (error.response.status === 401 && requireAuth) {
                try {
                    await refreshAccessToken();
                    // Retry the original request with new token
                    const retryResponse = await axios({
                        method,
                        url,
                        data: data || undefined,
                        headers: getHeaders(true, requireAuth),
                        timeout: 10000,
                    });
                    return retryResponse.data;
                } catch (refreshError) {
                    throw new Error('Session expired. Please login again.');
                }
            }
            throw new Error(error.response.data?.error || error.response.statusText);
        }
        throw error;
    }
}

// Auth
export async function login(email, password) {
    try {
        const response = await apiRequest("/login", "POST", { email, password }, false);

        if (response.user?.uid) {
            localStorage.setItem('userId', response.user.uid);
        }
        if (response.accessToken) {
            localStorage.setItem('accessToken', response.accessToken);
        }
        if (response.refreshToken) {
            localStorage.setItem('refreshToken', response.refreshToken);
        }

        return response;
    } catch (error) {
        console.error("Login failed:", error.message || error);
        throw error;
    }
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
export function updateAccountStatus(uid, status, rejectionReason) {
    const data = { status };
    if (status === 'rejected' && rejectionReason) {
        data.rejectionReason = rejectionReason;
    }
    return apiRequest(`/accounts/${uid}/status`, "PUT", data);
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

export function getRejectedAccounts() {
    return apiRequest("/rejected-accounts", "GET");
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
    return apiRequest("/verified-hog-owners", "GET");
}
