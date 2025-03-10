import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ProductManagementComponent = () => {
  const [products, setProducts] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [processingPurchase, setProcessingPurchase] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch available products from the backend API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/products');
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  // Function to add a product to the cart
  const addToCart = (product) => {
    const newCartItems = [...cartItems];
    const existingItem = newCartItems.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      newCartItems.push({ ...product, quantity: 1 });
    }

    setCartItems(newCartItems);
    
    // Show a small notification
    const notification = document.getElementById('notification');
    notification.classList.remove('opacity-0');
    notification.classList.add('opacity-100');
    
    setTimeout(() => {
      notification.classList.remove('opacity-100');
      notification.classList.add('opacity-0');
    }, 2000);
  };

  // Function to remove an item from cart
  const removeFromCart = (itemId) => {
    const newCartItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(newCartItems);
  };

  // Function to update item quantity
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const newCartItems = [...cartItems];
    const itemToUpdate = newCartItems.find(item => item.id === itemId);
    
    if (itemToUpdate) {
      itemToUpdate.quantity = newQuantity;
      setCartItems(newCartItems);
    }
  };

  // Function to handle checkout
  const checkout = async () => {
    setProcessingPurchase(true);
    try {
      for (let item of cartItems) {
        await axios.post('http://127.0.0.1:5000/api/buy_product', {
          product_id: item.id,
          quantity: item.quantity,
        });
      }
      // Update product stock after successful purchase
      const updatedProducts = products.map(product => {
        const purchasedItem = cartItems.find(item => item.id === product.id);
        if (purchasedItem) {
          return { ...product, stock: product.stock - purchasedItem.quantity };
        }
        return product;
      });
      
      setProducts(updatedProducts);
      alert("Checkout successful!");
      setCartItems([]);
      setCartOpen(false);
    } catch (error) {
      console.error("Error during checkout:", error);
      alert("Error during checkout.");
    }
    setProcessingPurchase(false);
  };

  // Calculate total price
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.sell_price * item.quantity), 0).toFixed(2);
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 font-sans bg-gray-50 min-h-screen">
      {/* Page header with search */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Product Catalog</h1>
            <p className="text-gray-600">Browse our selection of quality products</p>
          </div>
          
          <div className="relative mt-4 sm:mt-0 w-full sm:w-64">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg 
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {/* Category tabs (placeholder - can be made functional) */}
        <div className="flex overflow-x-auto space-x-4 pb-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-full whitespace-nowrap">All Products</button>
          <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-full whitespace-nowrap hover:bg-gray-100">Food & Beverages</button>
          <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-full whitespace-nowrap hover:bg-gray-100">Electronics</button>
          <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-full whitespace-nowrap hover:bg-gray-100">Home Goods</button>
          <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-full whitespace-nowrap hover:bg-gray-100">Personal Care</button>
        </div>
      </div>

      {/* Products grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 transition-transform hover:transform hover:scale-105 hover:shadow-lg">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{product.name}</h3>
                
                {/* Price and stock info */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm font-medium text-gray-600">
                      {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">₹{product.sell_price}</span>
                </div>
                
                {/* Add to cart button */}
                <button 
                  onClick={() => addToCart(product)} 
                  className={`w-full py-2 px-4 rounded-md transition duration-200 ease-in-out flex items-center justify-center ${
                    product.stock <= 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  disabled={product.stock <= 0}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                  </svg>
                  {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification */}
      <div id="notification" className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg transition-opacity duration-300 opacity-0 z-50">
        Item added to cart!
      </div>

      {/* Cart button */}
      <div className="fixed bottom-4 right-4 z-10">
        <button 
          onClick={() => setCartOpen(true)} 
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-5 rounded-full shadow-lg transition duration-200 ease-in-out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          </svg>
          <span className="font-medium">{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
        </button>
      </div>

      {/* Cart modal */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-200 p-4">
              <h2 className="text-xl font-semibold text-gray-800">Your Cart</h2>
              <button 
                onClick={() => setCartOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="mt-4 text-gray-500">Your cart is empty</p>
                  <button 
                    onClick={() => setCartOpen(false)} 
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <li key={item.id} className="py-4">
                      <div className="flex justify-between">
                        <div className="w-1/2">
                          <h3 className="text-gray-800 font-medium truncate">{item.name}</h3>
                          <p className="text-gray-500 text-sm">₹{item.sell_price} each</p>
                        </div>
                        
                        <div className="flex items-center w-1/4">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <span className="mx-2 w-8 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-end w-1/4">
                          <span className="font-semibold text-gray-800 mr-2">
                            ₹{(item.sell_price * item.quantity).toFixed(2)}
                          </span>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-gray-800">₹{calculateTotal()}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="font-semibold text-gray-800">Total:</span>
                  <span className="font-bold text-blue-600 text-xl">₹{calculateTotal()}</span>
                </div>
                <button
                  onClick={checkout}
                  disabled={processingPurchase || cartItems.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition duration-200 ease-in-out disabled:bg-blue-300 text-lg font-medium"
                >
                  {processingPurchase ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : "Checkout"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagementComponent;