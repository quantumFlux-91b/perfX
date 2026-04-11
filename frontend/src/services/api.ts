import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// Auth endpoints
export const loginUser = async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

export const registerUser = async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

// Profile endpoints
export const updateUserProfile = async (id: string, profileData: any) => {
    const response = await api.put(`/users/${id}/profile`, profileData);
    return response.data;
};

export default api;
