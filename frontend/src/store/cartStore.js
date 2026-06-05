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

export const VIETNAM_PROVINCES = [
  { name: 'Ha Noi', districts: ['Ba Dinh', 'Hoan Kiem', 'Tay Ho', 'Cau Giay', 'Dong Da', 'Hai Ba Trung', 'Hoang Mai', 'Long Bien', 'Thanh Xuan', 'Bac Tu Liem', 'Nam Tu Liem'] },
  { name: 'Ho Chi Minh City', districts: ['District 1', 'District 2', 'District 3', 'District 4', 'District 5', 'District 6', 'District 7', 'District 8', 'District 9', 'District 10', 'District 11', 'District 12', 'Thu Duc District', 'Binh Thanh', 'Binh Tan', 'Go Vap', 'Phu Nhuan', 'Tan Binh', 'Tan Phu'] },
  { name: 'Da Nang', districts: ['Hai Chau', 'Thanh Khe', 'Son Tra', 'Ngu Hanh Son', 'Lien Chieu', 'Cam Le'] },
  { name: 'Hai Phong', districts: ['Hong Bang', 'Ngo Quyen', 'Le Chan', 'Kien An', 'Duong Kinh', 'Thuy Nguyen', 'An Duong', 'Vu Thu', 'Tien Lang', 'Cat Hai', 'Bach Long Vi'] },
  { name: 'Can Tho', districts: ['Ninh Kieu', 'Binh Thuy', 'Cai Rang', 'Phong Dien', 'Thot Not', 'Co Do', 'Vinh Thanh'] },
  { name: 'An Giang', districts: ['Long Xuyen', 'Chau Doc', 'Tan Chau', 'Phu Tan', 'Cho Moi', 'Thoai Son', 'Tri Ton'] },
  { name: 'Ba Ria - Vung Tau', districts: ['Vung Tau', 'Ba Ria', 'Long Dien', 'Dat Do', 'Con Dao'] },
  { name: 'Bac Lieu', districts: ['Bac Lieu', 'Hong Dan', 'Gia Rai', 'Vinh Loi'] },
  { name: 'Bac Giang', districts: ['Bac Giang', 'Yen The', 'Tan Yen', 'Luc Nam', 'Luc Ngan', 'Son Dong', 'Hiep Hoa', 'Viet Yen'] },
  { name: 'Bac Kan', districts: ['Bac Kan', 'Pac Nam', 'Ba Be', 'Ngan Son', 'Cho Don'] },
  { name: 'Bac Ninh', districts: ['Bac Ninh', 'Tu Son', 'Yen Phong', 'Yen Binh', 'Tien Du'] },
  { name: 'Ben Tre', districts: ['Ben Tre', 'Chau Thanh', 'Cho Lach', 'Mo Cay Nam', 'Mo Cay Bac', 'Thanh Phu'] },
  { name: 'Binh Duong', districts: ['Thu Dau Mot', 'Di An', 'Binh Duong', 'Thuan An', 'Tan Uyen', 'Ben Cat', 'Bau Bang', 'Phu Giao'] },
  { name: 'Binh Phuoc', districts: ['Dong Xoai', 'Phu Rieng', 'Binh Long', 'Chon Thanh', 'Loc Ninh', 'Bu Gia Map', 'Bu Dop'] },
  { name: 'Binh Thuan', districts: ['Phan Thiet', 'La Gi', 'Tuy Phong', 'Bac Binh', 'Ham Tan', 'Ham Thuan Bac', 'Ham Thuan Nam', 'Tanh Linh', 'Duc Linh'] },
  { name: 'Ca Mau', districts: ['Ca Mau', 'Nam Can', 'Ngoc Hien', 'Dam Doi', 'U Minh', 'Thoi Binh'] },
  { name: 'Cao Bang', districts: ['Cao Bang', 'Bao Lam', 'Bao Lac', 'Thach An', 'Ha Quang', 'Trung Ky', 'Quang Uyen', 'Hoa An'] },
  { name: 'Dak Lak', districts: ['Buon Ma Thuot', 'Buon Ho', 'Ea Sup', 'Cu M\'Gar', 'Krong Pac', 'Krong A Na', 'Lak', 'M\'Drak', 'Ea Kar'] },
  { name: 'Dak Nong', districts: ['Gia Nghia', 'Dak Glong', 'Dak Mil', 'Dak R\'Lap', 'Cu Jut', 'Tuy Duc'] },
  { name: 'Dien Bien', districts: ['Dien Bien Phu', 'Muong Ang', 'Muong Cha', 'Tua Chua', 'Nam Po', 'Tuan Giao'] },
  { name: 'Dong Nai', districts: ['Bien Hoa', 'Long Khanh', 'Thong Nhat', 'Trang Bom', 'Dinh Quan', 'Xuan Loc', 'Cam My', 'Long Thanh', 'Vinh Cuu'] },
  { name: 'Dong Thap', districts: ['Cao Lanh', 'Sa Dec', 'Hong Ngu', 'Tan Hong', 'Thanh Binh', 'Chau Thanh', 'Thap Muoi', 'Lap Vo', 'Lai Vung'] },
  { name: 'Gia Lai', districts: ['Pleiku', 'An Khe', 'Ayun Pa', 'Chu Se', 'Chu Prong', 'Duc Co', 'Ia Grai', 'Kbang', 'Kong Chro', 'Mang Yang', 'Phu Thien'] },
  { name: 'Ha Giang', districts: ['Ha Giang', 'Vi Xuyen', 'Yen Minh', 'Xin Man', 'Bac Me', 'Quan Ba', 'Thuong Lam', 'Dong Van'] },
  { name: 'Ha Nam', districts: ['Phu Ly', 'Duong Son', 'Kim Bang', 'Ly Nhan', 'Thanh Liem'] },
  { name: 'Ha Tinh', districts: ['Ha Tinh', 'Hong Linh', 'Thach Ha', 'Cam Xuyen', 'Cam Thuy', 'Ky Anh', 'Ky Son'] },
  { name: 'Hai Duong', districts: ['Hai Duong', 'Chi Linh', 'Kinh Mon', 'Nam Sach', 'Thanh Ha', 'Tu Ky', 'Ninh Giang', 'Gia Loc'] },
  { name: 'Hoa Binh', districts: ['Hoa Binh', 'Tan Lac', 'Lac Son', 'Lac Thuy', 'Yen Thuy', 'Yen Phong', 'Kim Boi', 'Cao Phong'] },
  { name: 'Hung Yen', districts: ['Hung Yen', 'My Hao', 'Van Lam', 'Van Giang', 'Yen My', 'Khoai Chau', 'Tien Lu'] },
  { name: 'Khanh Hoa', districts: ['Nha Trang', 'Cam Ranh', 'Ninh Hoa', 'Van Ninh', 'Khanh Vinh', 'Dien Khanh', 'Cam Lam', 'Truong Sa'] },
  { name: 'Kien Giang', districts: ['Rach Gia', 'Ha Tien', 'Phu Quoc', 'Tan Hiep', 'Giang Thanh', 'An Bien', 'An Minh', 'Kien Luong', 'Hon Dat', 'Vinh Thuan'] },
  { name: 'Kon Tum', districts: ['Kon Tum', 'Dak Glei', 'Dak To', 'Ngoc Hoi', 'Ie Pek', 'Sa Thay', 'Tu Mo Rong'] },
  { name: 'Lai Chau', districts: ['Lai Chau', 'Tam Duong', 'Phong Tho', 'Nam Nhun', 'Tan Uyen'] },
  { name: 'Lam Dong', districts: ['Da Lat', 'Bao Loc', 'Dao Lam', 'Duc Trong', 'Lam Ha', 'Cat Tien', 'Di Linh', 'Thach That'] },
  { name: 'Lang Son', districts: ['Lang Son', 'Chi Lang', 'Trang Dinh', 'Cao Loc', 'Van Lang', 'Van Quan', 'Binh Gia', 'Huu Lung'] },
  { name: 'Lao Cai', districts: ['Lao Cai', 'Sapa', 'Bac Hha', 'Bao Thang', 'Bao Yen', 'Van Ban', 'Muong Khuong', 'Si Ma Cai'] },
  { name: 'Long An', districts: ['Tan An', 'My Tho', 'Can Duoc', 'Can Giuoc', 'Chau Thanh', 'Duc Hue', 'Duc Hoa', 'Ben Luc', 'Thanh Hoa', 'Vinh Hung'] },
  { name: 'Nam Dinh', districts: ['Nam Dinh', 'Giao Thuy', 'Y Yen', 'Xuan Truong', 'Truc Ninh', 'Vu Ban'] },
  { name: 'Nghe An', districts: ['Vinh', 'Cua Lo', 'Hoang Mai', 'Quynh Luu', 'Quy Hop', 'Quy Chau', 'Tuong Duong', 'Anh Son', 'Dien Chau', 'Yen Thanh', 'Thanh Chuong', 'Hung Nguyen', 'Con Cuong'] },
  { name: 'Ninh Binh', districts: ['Ninh Binh', 'Tam Diep', 'Yen Mo', 'Nho Quan', 'Gia Vien', 'Hoa Lu'] },
  { name: 'Ninh Thuan', districts: ['Phan Rang', 'Ninh Hai', 'Ninh Phuoc', 'Thai Phien', 'Tuy Phong'] },
  { name: 'Phu Tho', districts: ['Viet Tri', 'Phu Tho', 'Thanh Son', 'Tan Son', 'Yen Lap', 'Cua He', 'Phu Ninh', 'Doan Hung'] },
  { name: 'Phu Yen', districts: ['Tuy Hoa', 'Song Cau', 'Dong Hoa', 'Phu Hoa', 'Tay Hoa', 'Son Hoa', 'Mang Yang'] },
  { name: 'Quang Binh', districts: ['Dong Ha', 'Quang Tri', 'Vinh Linh', 'Gio Linh', 'Dakrong', 'Bo Trach', 'Quang Ninh'] },
  { name: 'Quang Nam', districts: ['Hoi An', 'Tam Ky', 'Duy Xuyen', 'Dien Ban', 'Phu Ninh', 'Nong Son', 'Thang Binh', 'Tien Phuoc', 'Bac Tra My', 'Nam Giang', 'Phuoc Son', 'Hiep Duc', 'Que Son'] },
  { name: 'Quang Ngai', districts: ['Quang Ngai', 'Binh Son', 'Mo Duc', 'Nghia Hanh', 'Tu Nghia', 'Son Tinh', 'Son Ha', 'Ly Son'] },
  { name: 'Quang Ninh', districts: ['Ha Long', 'Cam Pha', 'Mong Cai', 'Uong Bi', 'Binh Lieu', 'Co To', 'Tien Yen', 'Yen Hung', 'Dong Trieu', 'Van Don'] },
  { name: 'Quang Tri', districts: ['Dong Ha', 'Quang Tri', 'Vinh Linh', 'Gio Linh', 'Dakrong', 'Bo Trach', 'Quang Ninh'] },
  { name: 'Soc Trang', districts: ['Soc Trang', 'Ba Tri', 'Cu Lao Dung', 'Ke Sach', 'Long Phu', 'My Tu', 'Thanh Tri', 'Tran De', 'Vinh Chau'] },
  { name: 'Son La', districts: ['Son La', 'Quynh Nhai', 'Phu Yen', 'Moc Chau', 'Yen Chau', 'Song Ma', 'Thuan Chau'] },
  { name: 'Tay Ninh', districts: ['Tay Ninh', 'Trang Bang', 'Go Dau', 'Ben Cat', 'Duong Minh Chau', 'Chau Thanh', 'Hoa Thanh'] },
  { name: 'Thai Binh', districts: ['Thai Binh', 'Quynh Coi', 'Hung Ha', 'Kien Xuong', 'Thai Thuy'] },
  { name: 'Thai Nguyen', districts: ['Thai Nguyen', 'Son Duong', 'Dinh Hoa', 'Phu Luong', 'Vo Nhai'] },
  { name: 'Thanh Hoa', districts: ['Thanh Hoa', 'Bim Son', 'Sam Son', 'Muong Lat', 'Quan Hoa', 'Quan Son', 'Thuong Xuan', 'Yen Dinh', 'Thach Thanh', 'Hau Loc', 'Hoang Hoa', 'Nong Cong', 'Vinh Loc', 'Tinh Gia', 'Nhu Thanh', 'Nhu Xuan'] },
  { name: 'Thua Thien Hue', districts: ['Hue City', 'A Luoi', 'Phong Dien', 'Quang Dien', 'Phu Loc', 'Phu Vang', 'Huong Thuy', 'Huong Tra'] },
  { name: 'Tien Giang', districts: ['My Tho', 'Go Cong', 'Go Cong Tay', 'Cai Be', 'Cai Lay', 'Chau Thanh', 'Cho Gao', 'Tan Phu Dong', 'Tan Phuong'] },
  { name: 'Tuyen Quang', districts: ['Tuyen Quang', 'Na Hang', 'Ham Yen', 'Yen Son', 'Son Duong'] },
  { name: 'Vinh Long', districts: ['Vinh Long', 'Mang Thit', 'Vung Liem', 'Tam Binh', 'Long Ho', 'Tra On'] },
  { name: 'Vinh Phuc', districts: ['Vinh Yen', 'Phuc Yen', 'Tam Duong', 'Tam Dao', 'Yen Lac', 'Song Cong'] },
  { name: 'Yen Bai', districts: ['Yen Bai', 'Luc Yen', 'Van Chan', 'Mu Cang Chai', 'Tran Yen', 'Tram Tau'] }
];


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
