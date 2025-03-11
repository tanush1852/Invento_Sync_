// Frontend: InventoryQRSystem.jsx
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { QrReader } from 'react-qr-reader';
import axios from 'axios';

const InventoryQRSystem = () => {
  // States for the component
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('list'); // 'list', 'scan', 'detail'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [purchaseStatus, setPurchaseStatus] = useState({ message: '', type: '' });
  const apiUrl = 'http://localhost:5000/api'; // URL to your Python backend
  
  // Fetch products from the backend API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/products`);
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
      
      // For demo/fallback purposes
      const demoProducts = [
        { id: '1', product: 'Fairy Lights', date: '03-08-2025', expiryDays: 500, stock: 2500, costPrice: 250, sellPrice: 300, salesQuantity: 200, profit: 10000, lowThreshold: 100, highThreshold: 5000 },
        { id: '2', product: 'Protein Shake', date: '03-08-2025', expiryDays: 180, stock: 2000, costPrice: 900, sellPrice: 1000, salesQuantity: 180, profit: 18000, lowThreshold: 20, highThreshold: 4000 },
        // other products...
      ];
      setProducts(demoProducts);
    } finally {
      setLoading(false);
    }
  };

  // Update product after purchase via API
  const updateProductAfterPurchase = async (productId, quantity) => {
    try {
      // Find the product first to show immediate UI feedback
      const productIndex = products.findIndex(p => p.id === productId);
      
      if (productIndex === -1) {
        throw new Error('Product not found');
      }
      
      const product = products[productIndex];
      
      // Check stock
      if (product.stock < quantity) {
        throw new Error(`Not enough stock available. Only ${product.stock} items left.`);
      }
      
      // Call the backend API to update the product
      const response = await axios.post(`${apiUrl}/purchase`, {
        productId: productId,
        quantity: quantity
      });
      
      if (response.data.success) {
        // Update local state with the updated product from the backend
        const updatedProducts = [...products];
        updatedProducts[productIndex] = response.data.product;
        
        setProducts(updatedProducts);
        setSelectedProduct(response.data.product);
        
        return { 
          success: true, 
          message: `Successfully purchased ${quantity} units of ${product.product}!` 
        };
      } else {
        throw new Error(response.data.message || 'Failed to update product');
      }
    } catch (error) {
      console.error("Error updating product:", error);
      return { 
        success: false, 
        message: error.message || 'An error occurred during purchase' 
      };
    }
  };

  // Handle QR code scan
  const handleScan = (result) => {
    if (result) {
      try {
        // Parse the QR data - expected format is JSON with product ID
        const data = JSON.parse(result.text);
        
        if (data && data.productId) {
          const product = products.find(p => p.id === data.productId);
          
          if (product) {
            setSelectedProduct(product);
            setMode('detail');
          } else {
            setError('Product not found.');
          }
        } else {
          setError('Invalid QR code format. Please try another code.');
        }
      } catch (err) {
        setError('Invalid QR code detected. Please try again.');
      }
    }
  };

  // Handle purchase submission
  const handlePurchase = async () => {
    if (!selectedProduct) return;
    
    setPurchaseStatus({ message: 'Processing...', type: 'info' });
    
    const result = await updateProductAfterPurchase(selectedProduct.id, purchaseQuantity);
    
    setPurchaseStatus({
      message: result.message,
      type: result.success ? 'success' : 'error'
    });
    
    if (result.success) {
      // Reset purchase quantity after successful purchase
      setPurchaseQuantity(1);
    }
  };

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Generate QR code data for a product
  const generateQRData = (product) => {
    return JSON.stringify({
      productId: product.id,
      timestamp: new Date().getTime() // Add timestamp to prevent caching
    });
  };

  // Render different sections based on current mode
  const renderContent = () => {
    switch (mode) {
      case 'scan':
        return (
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4 text-center">Scan Product QR Code</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="overflow-hidden rounded-lg shadow-lg mb-4">
              <QrReader
                constraints={{ facingMode: 'environment' }}
                onResult={handleScan}
                scanDelay={500}
                style={{ width: '100%' }}
              />
            </div>
            
            <button 
              onClick={() => setMode('list')} 
              className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
            >
              Back to Products
            </button>
          </div>
        );
        
      case 'detail':
        if (!selectedProduct) return <div>No product selected</div>;
        
        return (
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gray-50 py-4 px-6 border-b">
              <h2 className="text-xl font-bold">{selectedProduct.product}</h2>
              <p className="text-gray-600">ID: {selectedProduct.id}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Price:</p>
                  <p className="text-xl font-bold">${selectedProduct.sellPrice}</p>
                </div>
                <div>
                  <p className="text-gray-600">Available Stock:</p>
                  <p className={`text-xl font-bold ${selectedProduct.stock <= selectedProduct.lowThreshold ? 'text-red-500' : ''}`}>
                    {selectedProduct.stock}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-gray-600 mb-1">Expiry Date:</p>
                <p>{selectedProduct.date} ({selectedProduct.expiryDays} days)</p>
              </div>
              
              {purchaseStatus.message && (
                <div className={`p-3 rounded ${
                  purchaseStatus.type === 'success' ? 'bg-green-100 text-green-700' :
                  purchaseStatus.type === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {purchaseStatus.message}
                </div>
              )}
              
              {selectedProduct.stock > 0 && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="quantity" className="block text-gray-600 mb-1">Quantity:</label>
                    <input
                      id="quantity"
                      type="number"
                      min="1"
                      max={selectedProduct.stock}
                      value={purchaseQuantity}
                      onChange={(e) => setPurchaseQuantity(Math.max(1, Math.min(selectedProduct.stock, parseInt(e.target.value) || 1)))}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  
                  <button
                    onClick={handlePurchase}
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                    disabled={purchaseStatus.type === 'info'}
                  >
                    {purchaseStatus.type === 'info' ? 'Processing...' : `Buy Now ($${(selectedProduct.sellPrice * purchaseQuantity).toFixed(2)})`}
                  </button>
                </div>
              )}
              
              <button 
                onClick={() => {
                  setMode('list');
                  setPurchaseStatus({ message: '', type: '' });
                }} 
                className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
              >
                Back to Products
              </button>
            </div>
          </div>
        );
        
      case 'list':
      default:
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Inventory QR Codes</h1>
              <button 
                onClick={() => setMode('scan')} 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Scan QR Code
              </button>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 shadow hover:shadow-md transition-shadow">
                  <h2 className="text-xl font-semibold mb-2">{product.product}</h2>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div>
                      <p><span className="font-medium">Stock:</span> {product.stock}</p>
                      <p><span className="font-medium">Price:</span> ${product.sellPrice}</p>
                      <p><span className="font-medium">Expiry:</span> {product.expiryDays} days</p>
                    </div>
                    <div>
                      <p className={`font-medium ${product.stock <= product.lowThreshold ? 'text-red-500' : ''}`}>
                        {product.stock <= product.lowThreshold ? 'Low Stock!' : 
                         product.stock >= product.highThreshold ? 'Overstocked' : 'In Stock'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center mb-3">
                    <QRCode 
                      value={generateQRData(product)} 
                      size={150}
                      level={"H"}
                      includeMargin={true}
                    />
                  </div>
                  
                  <div className="text-center mt-2">
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setMode('detail');
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {renderContent()}
    </div>
  );
};

export default InventoryQRSystem;