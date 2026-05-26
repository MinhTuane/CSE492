import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const getCurrentUserId = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user?.id || null;
    }
  } catch (e) {
    return null;
  }
  return null;
};

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      userCarts: {},

      syncToUser: () => {
        const userId = getCurrentUserId();
        if (userId) {
          const { items, userCarts } = get();
          set({ userCarts: { ...userCarts, [userId]: items } });
        }
      },

      loadUserCart: (userId) => {
        const { userCarts, items } = get();
        const savedUserCart = userCarts[userId] || [];
        
        const mergedItems = [...savedUserCart];
        items.forEach(guestItem => {
          if (!mergedItems.find(i => i.id === guestItem.id)) {
            mergedItems.push(guestItem);
          }
        });

        set({ 
          items: mergedItems,
          userCarts: { ...userCarts, [userId]: mergedItems }
        });
      },

      saveAndClearCart: (userId) => {
        const { items, userCarts } = get();
        if (userId) {
          set({ 
            userCarts: { ...userCarts, [userId]: items },
            items: [] 
          });
        } else {
          set({ items: [] });
        }
      },

      addItem: (product) => {
        const items = get().items;
        const existingItem = items.find((item) => item.id === product.id);

        if (existingItem) {
          // Increase quantity if already in cart
          existingItem.quantity = (existingItem.quantity || 1) + 1;
          set({ items: [...items] });
          get().syncToUser();
          return;
        }

        const isAccessory = product?.itemType === 'accessory' || (!!product?.name && !product?.model);

        let cartItem;
        if (isAccessory) {
          cartItem = {
            id: product.id,
            name: product.name,
            brand: product.brand,
            category: product.category,
            originalPrice: product.price,
            price: product.price,
            itemType: 'accessory',
            images: product.imageUrl ? [product.imageUrl] : (product.images?.length > 0 ? [product.images[0]] : []),
            quantity: 1,
            stock: product.stock || 0
          };
        } else {
          const discountedPrice = product.discountPercentage > 0
            ? product.price * (1 - product.discountPercentage / 100)
            : product.price;

          cartItem = {
            id: product.id,
            brand: product.brand,
            model: product.model,
            originalPrice: product.price,
            price: discountedPrice,
            discountPercentage: product.discountPercentage || 0,
            category: product.category,
            itemType: 'motorcycle',
            images: product.images?.length > 0 ? [product.images[0]] : [],
            quantity: 1,
            stock: product.stock || 0
          };
        }

        set({ items: [...items, cartItem] });
        get().syncToUser();
      },

      updateQuantity: (productId, quantity) => {
        const items = get().items;
        const item = items.find((i) => i.id === productId);
        
        if (!item) return;
        
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          set({ items: items.filter((i) => i.id !== productId) });
        } else {
          // Check stock limit
          if (item.stock && quantity > item.stock) {
            return; // Don't allow quantity to exceed stock
          }
          item.quantity = quantity;
          set({ items: [...items] });
        }
        
        get().syncToUser();
      },

      incrementQuantity: (productId) => {
        const items = get().items;
        const item = items.find((i) => i.id === productId);
        
        if (!item) return;
        
        const newQuantity = (item.quantity || 1) + 1;
        
        // Check stock limit
        if (item.stock && newQuantity > item.stock) {
          return; // Don't allow quantity to exceed stock
        }
        
        item.quantity = newQuantity;
        set({ items: [...items] });
        get().syncToUser();
      },

      decrementQuantity: (productId) => {
        const items = get().items;
        const item = items.find((i) => i.id === productId);
        
        if (!item) return;
        
        const newQuantity = (item.quantity || 1) - 1;
        
        if (newQuantity <= 0) {
          // Remove item if quantity becomes 0
          set({ items: items.filter((i) => i.id !== productId) });
        } else {
          item.quantity = newQuantity;
          set({ items: [...items] });
        }
        
        get().syncToUser();
      },

      removeItem: (motorcycleId) => {
        set({ items: get().items.filter((item) => item.id !== motorcycleId) });
        get().syncToUser();
      },

      clearCart: () => {
        set({ items: [] });
        get().syncToUser();
      },

      getTotalAmount: () => {
        return get().items.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + (item.quantity || 1), 0);
      },
    }),
    {
      name: 'motorcycle-cart',
    }
  )
);

export default useCartStore;
