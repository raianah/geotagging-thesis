import axios from 'axios';
import { API_URL } from '../config';
import { getAuthHeader } from './authService';

export const notificationService = {
    // Fetch all notifications for the current user
    getNotifications: async () => {
        try {
            const response = await axios.get(`${API_URL}/notifications`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },

    // Mark a notification as read
    markAsRead: async (notificationId) => {
        try {
            const response = await axios.put(
                `${API_URL}/notifications/${notificationId}/read`,
                {},
                { headers: getAuthHeader() }
            );
            return response.data;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    // Delete a notification
    deleteNotification: async (notificationId) => {
        try {
            const response = await axios.delete(`${API_URL}/notifications/${notificationId}`, {
                headers: getAuthHeader()
            });
            if (response.status === 404) {
                throw new Error('Notification not found or not authorized');
            }
            return response.data;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    },

    // Create a new notification
    createNotification: async (notificationData) => {
        try {
            const response = await axios.post(
                `${API_URL}/notifications`,
                notificationData,
                { headers: getAuthHeader() }
            );
            // Return the first notification if it's a single user notification
            // or the array of notifications if it's for multiple users
            return Array.isArray(response.data) ? response.data[0] : response.data;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    },

    // Create notifications for multiple users
    createNotificationsForUsers: async (notificationData, targetUsers) => {
        try {
            if (!Array.isArray(targetUsers) || targetUsers.length === 0) {
                throw new Error('targetUsers must be a non-empty array');
            }

            const response = await axios.post(
                `${API_URL}/notifications`,
                { ...notificationData, targetUsers },
                { headers: getAuthHeader() }
            );

            if (!Array.isArray(response.data)) {
                throw new Error('Expected array of notifications in response');
            }

            return response.data;
        } catch (error) {
            console.error('Error creating notifications for users:', error);
            throw error;
        }
    },

    // Get unread notification count
    getUnreadCount: async () => {
        try {
            const response = await axios.get(`${API_URL}/notifications/unread/count`, {
                headers: getAuthHeader()
            });
            return response.data.count;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            throw error;
        }
    }
}; 