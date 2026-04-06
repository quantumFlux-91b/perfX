import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

export const mockUserId = '00000000-0000-0000-0000-000000000001';

export default api;
