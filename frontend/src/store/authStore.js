import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/auth.service';
import useCartStore from './cartStore';
import useWishlistStore from './wishlistStore';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      // Initialize auth state from localStorage on store creation
      initializeAuth: () => {
        const user = authService.getCurrentUser();
        const isAuthenticated = authService.isAuthenticated();
        set({ user, isAuthenticated });
      },

      login: async (credentials) => {
        const user = await authService.login(credentials);
        set({ user, isAuthenticated: true });
        
        // Load this user's specific cart and wishlist
        useCartStore.getState().loadUserCart(user.id);
        useWishlistStore.getState().loadUserWishlist(user.id);
        
        return user;
      },

      loginWithGoogle: async (idToken) => {
        const user = await authService.loginWithGoogle(idToken);
        set({ user, isAuthenticated: true });
        
        useCartStore.getState().loadUserCart(user.id);
        useWishlistStore.getState().loadUserWishlist(user.id);
        
        return user;
      },

      loginWithFacebook: async (accessToken) => {
        const user = await authService.loginWithFacebook(accessToken);
        set({ user, isAuthenticated: true });
        
        useCartStore.getState().loadUserCart(user.id);
        useWishlistStore.getState().loadUserWishlist(user.id);
        
        return user;
      },

      register: async (data) => {
        const user = await authService.register(data);
        set({ user, isAuthenticated: true });
        
        useCartStore.getState().loadUserCart(user.id);
        useWishlistStore.getState().loadUserWishlist(user.id);
        
        return user;
      },
      
      registerWithUsername: async (data) => {
        const user = await authService.registerWithUsername(data);
        set({ user, isAuthenticated: true });
        
        useCartStore.getState().loadUserCart(user.id);
        useWishlistStore.getState().loadUserWishlist(user.id);
        
        return user;
      },

      logout: () => {
        const currentUser = get().user;
        const userId = currentUser ? currentUser.id : null;
        
        authService.logout();
        set({ user: null, isAuthenticated: false });
        
        // Save current cart/wishlist to this user and clear for next session
        useCartStore.getState().saveAndClearCart(userId);
        useWishlistStore.getState().saveAndClearWishlist(userId);
      },

      updateUser: (userData) => {
        const updatedUser = { ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth state when store is created
useAuthStore.getState().initializeAuth();

if (typeof window !== 'undefined') {
  window.useAuthStore = useAuthStore;
}

export default useAuthStore;
