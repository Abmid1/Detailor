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
  (err) => {
    const msg = err.response?.data?.error ?? err.message ?? 'Network error';
    return Promise.reject(new Error(msg));
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const sendOtp  = (phone: string) => api.post('/auth/otp/send', { phone });
export const verifyOtp = (phone: string, code: string) =>
  api.post<{ token: string; user: User }>('/auth/otp/verify', { phone, code, role: 'customer' });
export const getMe    = () => api.get<{ user: User }>('/auth/me');
export const updateMe = (data: Partial<User>) => api.patch<{ user: User }>('/auth/me', data);

// ─── Bundles ──────────────────────────────────────────────────────────────────
export const getBundles = () => api.get<{ bundles: Bundle[] }>('/bundles');

// ─── Vehicles ─────────────────────────────────────────────────────────────────
export const getVehicles   = () => api.get<{ vehicles: Vehicle[] }>('/vehicles');
export const createVehicle = (data: Partial<Vehicle>) => api.post<{ vehicle: Vehicle }>('/vehicles', data);
export const updateVehicle = (id: string, data: Partial<Vehicle>) =>
  api.patch<{ vehicle: Vehicle }>(`/vehicles/${id}`, data);

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const getBookings    = () => api.get<{ bookings: Job[] }>('/bookings');
export const getBooking     = (id: string) => api.get<{ booking: Job }>(`/bookings/${id}`);
export const createBooking  = (data: CreateBookingPayload) =>
  api.post<{ booking: Job; momo_reference: string }>('/bookings', data);
export const cancelBooking  = (id: string) => api.delete(`/bookings/${id}`);

// ─── Payments ────────────────────────────────────────────────────────────────
export const getPaymentStatus = (reference: string) =>
  api.get<{ status: string }>(`/payments/${reference}/status`);

// ─── Ratings ─────────────────────────────────────────────────────────────────
export const submitRating = (job_id: string, stars: number, comment?: string) =>
  api.post('/ratings', { job_id, stars, comment });

// ─── Types ───────────────────────────────────────────────────────────────────
export interface User {
  id: string; phone: string; name?: string; role: string; push_token?: string;
}

export interface Bundle {
  id: string; name: string; description: string; includes: string[];
  price_ghs: number; duration_minutes: number; sort_order: number;
}

export interface Vehicle {
  id: string; user_id: string; make: string; model: string;
  year?: number; color?: string; plate?: string; notes?: string; is_default: boolean;
}

export interface Job {
  id: string; status: string; scheduled_at: string;
  location_address?: string; location_lat: number; location_lng: number;
  total_amount_ghs: number; payment_status: string;
  bundle_name?: string; vehicle_make?: string; vehicle_model?: string;
  technician_name?: string; technician_phone?: string;
  tech_lat?: number; tech_lng?: number;
}

export interface CreateBookingPayload {
  vehicle_id: string; bundle_id: string; scheduled_at: string;
  location_lat: number; location_lng: number; location_address?: string;
  customer_notes?: string; is_subscription?: boolean;
}
