import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const getCurrentUserId = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user?.id || null;
    }
  } catch {
    return null;
  }
  return null;
};

const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      userWishlists: {},

      syncToUser: () => {
        const userId = getCurrentUserId();
        if (userId) {
          const { items, userWishlists } = get();
          set({ userWishlists: { ...userWishlists, [userId]: items } });
        }
      },

      loadUserWishlist: (userId) => {
        const { userWishlists, items } = get();
        const savedWishlist = userWishlists[userId] || [];
        
        const mergedItems = [...savedWishlist];
        items.forEach(guestItem => {
          if (!mergedItems.find(i => i.id === guestItem.id)) {
            mergedItems.push(guestItem);
          }
        });

        set({ 
          items: mergedItems,
          userWishlists: { ...userWishlists, [userId]: mergedItems }
        });
      },

      saveAndClearWishlist: (userId) => {
        const { items, userWishlists } = get();
        if (userId) {
          set({ 
            userWishlists: { ...userWishlists, [userId]: items },
            items: [] 
          });
        } else {
          set({ items: [] });
        }
      },

      addItem: (motorcycle) => {
        const currentItems = get().items;
        if (!currentItems.find((item) => item.id === motorcycle.id)) {
          const wishlistItem = {
            id: motorcycle.id,
            brand: motorcycle.brand,
            model: motorcycle.model,
            price: motorcycle.price,
            category: motorcycle.category,
            images: motorcycle.images?.length > 0 ? [motorcycle.images[0]] : []
          };
          set({ items: [...currentItems, wishlistItem] });
          get().syncToUser();
        }
      },
      removeItem: (motorcycleId) => {
        set({ items: get().items.filter((item) => item.id !== motorcycleId) });
        get().syncToUser();
      },
      isInWishlist: (motorcycleId) => {
        return get().items.some((item) => item.id === motorcycleId);
      },
      clearWishlist: () => {
        set({ items: [] });
        get().syncToUser();
      },
    }),
    {
      name: 'wishlist-storage',
    }
  )
);

export default useWishlistStore;
