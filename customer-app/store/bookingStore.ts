import { create } from 'zustand';
import { Bundle, Vehicle } from '../services/api';

interface BookingDraft {
  bundle: Bundle | null;
  vehicle: Vehicle | null;
  scheduledAt: Date | null;
  locationLat: number | null;
  locationLng: number | null;
  locationAddress: string | null;
  customerNotes: string;
  isSubscription: boolean;
}

interface BookingStore extends BookingDraft {
  setBundle: (b: Bundle) => void;
  setVehicle: (v: Vehicle) => void;
  setSchedule: (date: Date) => void;
  setLocation: (lat: number, lng: number, address: string) => void;
  setNotes: (n: string) => void;
  setSubscription: (v: boolean) => void;
  reset: () => void;
}

const defaultDraft: BookingDraft = {
  bundle: null, vehicle: null, scheduledAt: null,
  locationLat: null, locationLng: null, locationAddress: null,
  customerNotes: '', isSubscription: false,
};

export const useBookingStore = create<BookingStore>((set) => ({
  ...defaultDraft,
  setBundle:       (bundle) => set({ bundle }),
  setVehicle:      (vehicle) => set({ vehicle }),
  setSchedule:     (scheduledAt) => set({ scheduledAt }),
  setLocation:     (locationLat, locationLng, locationAddress) =>
    set({ locationLat, locationLng, locationAddress }),
  setNotes:        (customerNotes) => set({ customerNotes }),
  setSubscription: (isSubscription) => set({ isSubscription }),
  reset:           () => set(defaultDraft),
}));
