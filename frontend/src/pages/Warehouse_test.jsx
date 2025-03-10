import React, { useState, useEffect } from 'react';

const WarehouseTransfer = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch warehouses on component mount
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/warehouses');
        const data = await response.json();
        setWarehouses(data.warehouses || []);

        if (data.warehouses?.length > 0) {
          setSelectedWarehouse(data.warehouses[0]);
        }
      } catch (err) {
        setError('Failed to load warehouses');
        console.error(err);
      }
    };

    fetchWarehouses();
  }, []);

  // Fetch products when warehouse changes
  useEffect(() => {
    if (!selectedWarehouse) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/products/${selectedWarehouse}`);
        const data = await response.json();

        console.log('Fetched Products:', data); // Debugging

        // Ensure products is always an array
        const productsArray = Array.isArray(data) ? data : data.products || [];
        setProducts(productsArray);

        if (productsArray.length > 0) {
          setSelectedProduct(productsArray[0].Products || '');
        }
      } catch (err) {
        setError('Failed to load products');
        console.error(err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedWarehouse]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedWarehouse || !selectedProduct || quantity <= 0) {
      setError('Please fill all fields with valid values');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://127.0.0.1:5001/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseId: selectedWarehouse,
          productName: selectedProduct,
          quantity: Number(quantity),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setMessage(data.message);

      // Update product stock in UI
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p.Products === selectedProduct
            ? { ...p, Stock: data.newStock || 0 }
            : p
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMaxQuantity = () => {
    const product = products.find((p) => p.Products === selectedProduct);
    return product ? product.Stock || 0 : 0;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Warehouse Transfer System
        </h1>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Select Warehouse
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              disabled={loading}
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse} value={warehouse}>
                  {warehouse}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Product
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              disabled={loading || products.length === 0}
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={product.Products} value={product.Products}>
                  {product.Products} (Available: {product.Stock || 0})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Quantity to Transfer
            </label>
            <input
              type="number"
              min="1"
              max={getMaxQuantity()}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={loading || !selectedProduct}
            />
            <p className="text-sm text-gray-500 mt-1">
              Maximum available: {getMaxQuantity()}
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 disabled:bg-gray-400"
            disabled={
              loading ||
              !selectedWarehouse ||
              !selectedProduct ||
              quantity <= 0 ||
              quantity > getMaxQuantity()
            }
          >
            {loading ? 'Processing...' : 'Transfer Stock'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WarehouseTransfer;
