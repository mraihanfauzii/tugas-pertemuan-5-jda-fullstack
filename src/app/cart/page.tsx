"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCart, saveCart, clearCart, CartItem } from '@/lib/cart-storage';

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const userId = session?.user?.id;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin"); // Redirect jika belum login
      return;
    }
    if (status === "authenticated" && userId) {
      setCartItems(getCart(userId)); // Muat keranjang berdasarkan userId
    }
  }, [status, router, userId]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold">Loading cart...</div>
      </div>
    );
  }

  // Pastikan hanya user yang authenticated yang bisa melihat cart
  if (status === "unauthenticated" || !userId) {
    return null; // Atau tampilkan pesan "Please login to view your cart"
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    let updatedCart: CartItem[];
    if (newQuantity <= 0) {
      updatedCart = cartItems.filter(item => item.id !== id);
    } else {
      updatedCart = cartItems.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      );
    }
    setCartItems(updatedCart);
    if (userId) {
      saveCart(userId, updatedCart);
    }
  };

  const handleRemoveItem = (id: string) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    if (userId) {
      saveCart(userId, updatedCart);
    }
  };

  const handleCheckout = () => {
    alert("Proceeding to checkout! (This is a mock checkout)");
    if (userId) {
      clearCart(userId);
      setCartItems([]); // Kosongkan tampilan keranjang
    }
    // Redirect to a confirmation page or home
    router.push("/dashboard");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>
      {cartItems.length === 0 ? (
        <p className="text-gray-600">Your cart is empty.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Product</th>
                  <th className="py-3 px-6 text-center">Price</th>
                  <th className="py-3 px-6 text-center">Quantity</th>
                  <th className="py-3 px-6 text-center">Total</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {cartItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      <div className="flex items-center">
                        <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-md mr-4" />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center">Rp {item.price.toLocaleString('id-ID')}</td>
                    <td className="py-3 px-6 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                        className="w-16 text-center border rounded-md py-1"
                      />
                    </td>
                    <td className="py-3 px-6 text-center">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</td>
                    <td className="py-3 px-6 text-center">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 flex justify-end items-center">
            <div className="text-right">
              <p className="text-xl font-bold text-gray-800">Total: Rp {calculateTotal().toLocaleString('id-ID')}</p>
              <button
                onClick={handleCheckout}
                className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition duration-300"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}