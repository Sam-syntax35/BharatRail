import { create } from 'zustand';
import { authApi } from '../api/auth.api';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initializeAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.getProfile();
      if (res.success && res.data?.user) {
        set({ user: res.data.user, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch {
      // 401 simply means guest/not logged in, so we don't throw an error here
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(email, password);
      if (res.success && res.loggedInUser) {
        set({ user: res.loggedInUser, isAuthenticated: true });
        return res;
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      set({ error: err.message || 'Failed to sign in' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  googleLogin: async (idToken) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.googleAuth(idToken);
      if (res.success && res.loggedInUser) {
        set({ user: res.loggedInUser, isAuthenticated: true });
        return res;
      }
      throw new Error(res.message || 'Google sign-in failed');
    } catch (err) {
      set({ error: err.message || 'Failed to authenticate with Google' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.updateProfile(data);
      if (res.success && res.data?.user) {
        // Merge user details
        set((state) => ({ user: { ...state.user, ...res.data.user } }));
        return res;
      }
      throw new Error(res.message || 'Failed to update profile');
    } catch (err) {
      set({ error: err.message || 'Profile update failed' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      await authApi.deleteProfile();
      set({ user: null, isAuthenticated: false });
    } catch (err) {
      set({ error: err.message || 'Failed to delete profile' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
