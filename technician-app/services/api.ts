import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = Constants.expoConfig?.extra?.API_URL ?? 'http://localhost:4000';

export const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => Promise.reject(new Error(err.response?.data?.error ?? err.message ?? 'Network error'))
);

export const sendOtp  = (phone: string) => api.post('/auth/otp/send', { phone });
export const verifyOtp = (phone: string, code: string) =>
  api.post<{ token: string; user: User }>('/auth/otp/verify', { phone, code, role: 'technician' });
export const updateMe = (data: Partial<User>) => api.patch<{ user: User }>('/auth/me', data);

export const getTodayRoute = () => api.get<{ jobs: TechJob[] }>('/jobs/route');
export const getAvailableJobs = () => api.get<{ jobs: TechJob[] }>('/jobs/available');
export const acceptJob = (id: string) => api.post<{ job: TechJob }>(`/jobs/${id}/accept`);
export const getJob        = (id: string) => api.get<{ job: TechJob; photos: Photo[] }>(`/jobs/${id}`);
export const updateStatus  = (id: string, status: string, extras?: object) =>
  api.patch(`/jobs/${id}/status`, { status, ...extras });
export const postLocation  = (id: string, lat: number, lng: number) =>
  api.post(`/jobs/${id}/location`, { lat, lng });
export const uploadPhotos  = (id: string, type: string, files: FormData) =>
  api.post(`/jobs/${id}/photos`, files, {
    params: { type },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const postNotes     = (id: string, tech_notes: string) =>
  api.post(`/jobs/${id}/notes`, { tech_notes });

export interface User {
  id: string; phone: string; name?: string; role: string; push_token?: string;
}

export interface TechJob {
  id: string; status: string; scheduled_at: string;
  customer_name: string; customer_phone: string;
  make: string; model: string; color: string; plate: string; vehicle_notes?: string;
  bundle_name: string; duration_minutes: number; bundle_includes: string[];
  location_lat: number; location_lng: number; location_address?: string;
  total_amount_ghs: number; payment_status: string;
  tech_notes?: string;
}

export interface Photo { id: string; type: string; url: string; created_at: string; }
