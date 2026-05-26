import { describe, it, expect, beforeEach } from 'vitest';
import useCartStore from '../src/store/cartStore';

describe('Cart Store', () => {
  // Reset store before each test
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it('should start with an empty cart', () => {
    const { items } = useCartStore.getState();
    expect(items.length).toBe(0);
  });

  it('should add an item to the cart', () => {
    const item = { id: 'm1', model: 'Yamaha R1', price: 1000, discountPercentage: 0 };
    
    useCartStore.getState().addItem(item);
    
    const { items } = useCartStore.getState();
    expect(items.length).toBe(1);
    expect(items[0].model).toBe('Yamaha R1');
  });

  it('should remove an item from the cart', () => {
    const item1 = { id: 'm1', name: 'Yamaha R1', price: 1000 };
    const item2 = { id: 'm2', name: 'Honda CBR', price: 2000 };
    
    const store = useCartStore.getState();
    store.addItem(item1);
    store.addItem(item2);
    
    expect(useCartStore.getState().items.length).toBe(2);
    
    useCartStore.getState().removeItem('m1');
    
    const newItems = useCartStore.getState().items;
    expect(newItems.length).toBe(1);
    expect(newItems[0].id).toBe('m2');
  });

  it('should clear the cart entirely', () => {
    const store = useCartStore.getState();
    store.addItem({ id: 'm1', name: 'Yamaha R1', price: 1000 });
    store.addItem({ id: 'm2', name: 'Honda CBR', price: 2000 });
    
    expect(useCartStore.getState().items.length).toBe(2);
    
    useCartStore.getState().clearCart();
    
    expect(useCartStore.getState().items.length).toBe(0);
  });
});