import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bold } from "lucide-react";

const BACKEND_URL = "http://192.168.1.4:5000"; // Change this if backend is hosted elsewhere

function InventoryQRSystem() {
  const [products, setProducts] = useState([]);
  const [qrData, setQrData] = useState({});
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/products`);
      setProducts(response.data.products);
      setQrData(response.data.qr_data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  };

  const purchaseProduct = async (productName) => {
    try {
      await axios.post(`${BACKEND_URL}/purchase/${productName}`, {
        quantity: quantities[productName] || 1, // Default to 1 if not set
      });
      fetchProducts(); // Refresh data after purchase
    } catch (error) {
      console.error("Error purchasing product:", error);
    }
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", maxWidth: "1200px", margin: "auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px",text:"bold" }}>Inventory QR Code System</h1>
      {loading ? (
        <p style={{ textAlign: "center" }}>Loading products...</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px" }}>
          {products.map((product) => (
            <div
              key={product["Products"]}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "20px",
                width: "300px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                backgroundColor: "#fff",
              }}
            >
              <h2 style={{ textAlign: "center" }}>{product["Products"]}</h2>
              <img
                src={`data:image/png;base64,${qrData[product["Products"]]?.image}`}
                alt="QR Code"
                style={{ width: "150px", height: "150px", marginBottom: "15px" }}
              />
              <p><strong>Price:</strong> ₹{product["Sell Price"]}</p>
              <p
                style={{
                  color: product["Stock"] < 100 ? "red" : "black",
                  fontWeight: product["Stock"] < 100 ? "bold" : "normal",
                }}
              >
                <strong>Stock:</strong> {product["Stock"]}
              </p>
              <p><strong>Expiry Days:</strong> {product["Expiry Days"]}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "10px 0" }}>
                <input
                  type="number"
                  min="1"
                  value={quantities[product["Products"]] || 1}
                  onChange={(e) => setQuantities({ ...quantities, [product["Products"]]: e.target.value })}
                  style={{
                    width: "50px",
                    padding: "5px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    textAlign: "center",
                  }}
                />
                <button
                  onClick={() => purchaseProduct(product["Products"])}
                  style={{
                    padding: "10px 15px",
                    borderRadius: "5px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    transition: "0.3s",
                  }}
                >
                  Purchase
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InventoryQRSystem;