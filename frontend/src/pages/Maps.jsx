import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";

const Maps = () => {
  const [store, setStore] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [travelTime, setTravelTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const addStore = async () => {
    const name = prompt("Enter store name:");
    if (!name) return;
    
    const address = prompt("Enter store address:");
    if (!address) return;

    setIsLoading(true);
    try {
      const response = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: { q: address, format: "json", limit: 1 },
      });

      if (response.data.length > 0) {
        const { lat, lon } = response.data[0];
        setStore({ name, address, lat: parseFloat(lat), lng: parseFloat(lon) });
      } else {
        alert("Store location not found! Please try a different address.");
      }
    } catch (error) {
      console.error("Error fetching store location:", error);
      alert("Failed to find location. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const addWarehouse = async () => {
    const name = prompt("Enter warehouse name:");
    if (!name) return;
    
    const address = prompt("Enter warehouse address:");
    if (!address) return;

    setIsLoading(true);
    try {
      const response = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: { q: address, format: "json", limit: 1 },
      });

      if (response.data.length > 0) {
        const { lat, lon } = response.data[0];
        setWarehouses([...warehouses, { name, address, lat: parseFloat(lat), lng: parseFloat(lon) }]);
      } else {
        alert("Warehouse location not found! Please try a different address.");
      }
    } catch (error) {
      console.error("Error fetching warehouse location:", error);
      alert("Failed to find location. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getTravelTime = async (warehouse) => {
    if (!store) {
      alert("Please enter a store first!");
      return;
    }

    setIsLoading(true);
    try {
      console.log(`Fetching travel time: ${store.name} (${store.address}) -> ${warehouse.name} (${warehouse.address})`);

      const response = await axios.post("http://127.0.0.1:5000/get_travel_time", {
        origin: store.address,
        destination: warehouse.address,
      });

      console.log("Response from Flask:", response.data);

      if (response.data.travel_time) {
        setTravelTime(response.data.travel_time);
        setRoutes([[store, warehouse]]);
      } else {
        alert("Failed to get travel time.");
      }
    } catch (error) {
      console.error("Error fetching travel time:", error);
      alert("Failed to calculate travel time. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const buttonStyle = {
    padding: "10px 16px",
    margin: "10px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
    transition: "background-color 0.3s, transform 0.1s",
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <button 
          onClick={addStore} 
          style={{ 
            ...buttonStyle, 
            backgroundColor: store ? "#2E7D32" : "#4CAF50" 
          }}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : (store ? "Change Store Location" : "Set Store Location")}
          {store && <span style={{ marginLeft: "8px", fontSize: "12px" }}>({store.name})</span>}
        </button>
        
        <button 
          onClick={addWarehouse} 
          style={{ 
            ...buttonStyle, 
            backgroundColor: "#2196F3",
            opacity: !store ? 0.7 : 1,
            cursor: !store ? "not-allowed" : "pointer"
          }}
          disabled={isLoading || !store}
          title={!store ? "Set a store location first" : "Add a warehouse location"}
        >
          {isLoading ? "Processing..." : "Add Warehouse"}
          <span style={{ marginLeft: "8px", fontSize: "12px" }}>({warehouses.length})</span>
        </button>
      </div>

      {isLoading && (
        <div style={{ margin: "10px 0", color: "#666" }}>
          Loading data, please wait...
        </div>
      )}

      <MapContainer center={[20, 78]} zoom={5} style={{ height: "500px", width: "100%", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Store Marker */}
        {store && (
          <Marker position={[store.lat, store.lng]}>
            <Popup>
              <strong>{store.name}</strong> (Store)<br />
              {store.address}
            </Popup>
          </Marker>
        )}

        {/* Warehouse Markers */}
        {warehouses.map((warehouse, index) => (
          <Marker
            key={index}
            position={[warehouse.lat, warehouse.lng]}
            eventHandlers={{ click: () => getTravelTime(warehouse) }}
          >
            <Popup>
              <strong>{warehouse.name}</strong><br />
              {warehouse.address}<br />
              <button 
                onClick={() => getTravelTime(warehouse)}
                style={{ 
                  padding: "5px 10px", 
                  backgroundColor: "#ff9800", 
                  border: "none", 
                  borderRadius: "3px",
                  color: "white", 
                  cursor: "pointer",
                  marginTop: "5px"
                }}
              >
                Calculate Route
              </button>
            </Popup>
          </Marker>
        ))}

        {/* Route Line */}
        {routes.length > 0 &&
          routes.map((route, index) => (
            <Polyline key={index} positions={route.map((point) => [point.lat, point.lng])} color="blue" weight={4} />
          ))}
      </MapContainer>

      {travelTime && (
        <div style={{ 
          marginTop: "15px", 
          padding: "10px 15px", 
          backgroundColor: "#f0f7ff", 
          borderRadius: "5px",
          border: "1px solid #bbd6fe"
        }}>
          <strong>Estimated Travel Time:</strong> {travelTime} minutes
        </div>
      )}
    </div>
  );
};

export default Maps;
