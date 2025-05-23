interface CartItem {
  productId: string;
  quantity: number;
  color: string;
}

interface WishlistItem {
  productId: string;
}

const GUEST_CART_KEY = 'guest_cart';
const GUEST_WISHLIST_KEY = 'guest_wishlist';

export const guestStorage = {
  // Cart operations
  getGuestCart: (): CartItem[] => {
    const cart = localStorage.getItem(GUEST_CART_KEY);
    return cart ? JSON.parse(cart) : [];
  },

  setGuestCart: (cart: CartItem[]) => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  },

  addToGuestCart: (item: CartItem) => {
    const cart = guestStorage.getGuestCart();
    const existingItem = cart.find(
      i => i.productId === item.productId && i.color === item.color
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      cart.push(item);
    }

    guestStorage.setGuestCart(cart);
  },

  updateGuestCartItem: (productId: string, color: string, quantity: number) => {
    const cart = guestStorage.getGuestCart();
    const item = cart.find(
      i => i.productId === productId && i.color === color
    );

    if (item) {
      item.quantity = quantity;
      guestStorage.setGuestCart(cart);
    }
  },

  removeFromGuestCart: (productId: string, color: string) => {
    const cart = guestStorage.getGuestCart();
    const newCart = cart.filter(
      item => !(item.productId === productId && item.color === color)
    );
    guestStorage.setGuestCart(newCart);
  },

  clearGuestCart: () => {
    localStorage.removeItem(GUEST_CART_KEY);
  },

  // Wishlist operations
  getGuestWishlist: (): WishlistItem[] => {
    const wishlist = localStorage.getItem(GUEST_WISHLIST_KEY);
    return wishlist ? JSON.parse(wishlist) : [];
  },

  setGuestWishlist: (wishlist: WishlistItem[]) => {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlist));
  },

  addToGuestWishlist: (productId: string) => {
    const wishlist = guestStorage.getGuestWishlist();
    if (!wishlist.some(item => item.productId === productId)) {
      wishlist.push({ productId });
      guestStorage.setGuestWishlist(wishlist);
    }
  },

  removeFromGuestWishlist: (productId: string) => {
    const wishlist = guestStorage.getGuestWishlist();
    const newWishlist = wishlist.filter(item => item.productId !== productId);
    guestStorage.setGuestWishlist(newWishlist);
  },

  clearGuestWishlist: () => {
    localStorage.removeItem(GUEST_WISHLIST_KEY);
  },

  // Merge guest data with user data
  mergeGuestDataWithUser: async (userId: string) => {
    const guestCart = guestStorage.getGuestCart();
    const guestWishlist = guestStorage.getGuestWishlist();

    // Merge cart
    for (const item of guestCart) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/${userId}/cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item),
        });
      } catch (error) {
        console.error('Error merging cart item:', error);
      }
    }

    // Merge wishlist
    for (const item of guestWishlist) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/users/${userId}/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item),
        });
      } catch (error) {
        console.error('Error merging wishlist item:', error);
      }
    }

    // Clear guest data
    guestStorage.clearGuestCart();
    guestStorage.clearGuestWishlist();
  }
}; 