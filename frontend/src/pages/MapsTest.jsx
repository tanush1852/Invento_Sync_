import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";

const MapsTest = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [storeMarker, setStoreMarker] = useState(null);
  const [routingControl, setRoutingControl] = useState(null);

  // Store location state
  const [storeLocation, setStoreLocation] = useState({
    name: "",
    address: "",
    lat: null,
    lon: null,
  });

  // Warehouse states
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseAddress, setWarehouseAddress] = useState("");
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [warehouseProducts, setWarehouseProducts] = useState([]);

  // UI states
  const [isStoreSet, setIsStoreSet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [routeInfo, setRouteInfo] = useState(null);
  const [popupType, setPopupType] = useState(null);
  const [formData, setFormData] = useState({ name: "", location: "" });

  // Sample product data
  const sampleProducts = [
    { id: 1, name: "Books", quantity: 49, price: 19.99 },
    { id: 2, name: "Bag", quantity: 58, price: 29.99 },
    { id: 3, name: "Chocolate", quantity: 80, price: 14.99 },
    { id: 4, name: "Fairy Lights", quantity: 103, price: 39.99 },
    { id: 5, name: "Keyboard", quantity: 46, price: 24.99 },
  ];

  // Add this state variable for loading products
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Add these states for warehouse sheet URLs
  const [warehouseSheets, setWarehouseSheets] = useState({
    "Warehouse 1": "https://docs.google.com/spreadsheets/d/1ZMK_TWm6HGPK2REJ007Sm-DDwglKZmIMPBN4EUWHMaw/edit?usp=sharing",
    "Warehouse 2": "https://docs.google.com/spreadsheets/d/1EiP1RMndWj9IG1tMVc9hC1z2wC8_hdYI0dir90Wu_S8/edit?usp=sharing"
  });

  // Initialize the map
  useEffect(() => {
    // Fix Leaflet icon issue
    fixLeafletIcon();

    if (mapRef.current && !mapInstanceRef.current) {
      // Set default view to Mumbai area
      const defaultLat = 19.076;
      const defaultLon = 72.8777;

      const newMap = L.map(mapRef.current).setView(
        [defaultLat, defaultLon],
        10
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(newMap);

      // Add zoom control
      L.control
        .zoom({
          position: "topleft",
        })
        .addTo(newMap);

      mapInstanceRef.current = newMap;
      setIsMapInitialized(true);
    }

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fix Leaflet default icon images
  const fixLeafletIcon = () => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });
  };

  // Add some initial demo data
  useEffect(() => {
    if (isMapInitialized && warehouses.length === 0) {
      const demoWarehouses = [
        {
          name: "Warehouse 1",
          address: "Kandivali, Mumbai",
          lat: 19.2081,
          lon: 72.8567,
          sheetUrl: "https://docs.google.com/spreadsheets/d/1ZMK_TWm6HGPK2REJ007Sm-DDwglKZmIMPBN4EUWHMaw/edit?usp=sharing"
        },
        {
          name: "Warehouse 2",
          address: "Thane, Mumbai",
          lat: 19.1982,
          lon: 72.9627,
          sheetUrl: "https://docs.google.com/spreadsheets/d/1EiP1RMndWj9IG1tMVc9hC1z2wC8_hdYI0dir90Wu_S8/edit?usp=sharing"
        },
        {
          name: "Warehouse 3",
          address: "Powai, Mumbai",
          lat: 19.1156,
          lon: 72.9090,
          sheetUrl: "https://docs.google.com/spreadsheets/d/1ZMK_TWm6HGPK2REJ007Sm-DDwglKZmIMPBN4EUWHMaw/edit?usp=sharing"
        },
      ];

      const demoStore = {
        name: "Store 1",
        address: "South Mumbai",
        lat: 19.076,
        lon: 72.8777,
      };

      // Add store
      const storeMarker = L.marker([demoStore.lat, demoStore.lon])
        .addTo(mapInstanceRef.current)
        .bindPopup(`<b>${demoStore.name}</b><br/>${demoStore.address}`)
        .openPopup();

      setStoreLocation(demoStore);
      setStoreMarker(storeMarker);
      setIsStoreSet(true);

      // Add warehouses
      demoWarehouses.forEach((warehouse) => {
        const marker = addWarehouseMarker(
          warehouse.lat,
          warehouse.lon,
          warehouse.name,
          warehouse.address
        );

        const warehouseWithProducts = {
          ...warehouse,
          marker,
          products: sampleProducts.map((product) => ({
            ...product,
            quantity: Math.floor(Math.random() * 100) + 10,
          })),
        };

        setWarehouses((prevWarehouses) => [
          ...prevWarehouses,
          warehouseWithProducts,
        ]);

        // Select Warehouse 1 by default
        if (warehouse.name === "Warehouse 1") {
          setSelectedWarehouse(warehouseWithProducts);
          setWarehouseProducts(warehouseWithProducts.products);
        }
      });
    }
  }, [isMapInitialized]);

  // Geocode function for addresses
  const geocodeAddress = async (address) => {
    setIsLoading(true);
    setError("");

    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
        {
          headers: {
            "Accept-Language": "en-US,en;q=0.9",
            "User-Agent": "StoreLocationApp/1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          displayName: data[0].display_name,
        };
      } else {
        setError("Address not found. Please enter a valid address.");
        return null;
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setError("Error finding location. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to add a warehouse marker
  const addWarehouseMarker = (lat, lon, name, address) => {
    if (!mapInstanceRef.current) return null;

    const warehouseMarker = L.marker([lat, lon])
      .addTo(mapInstanceRef.current)
      .bindPopup(`<b>${name}</b><br/>${address}`);

    warehouseMarker.on("click", () => {
      // When warehouse is clicked, show the route to the store
      if (storeLocation.lat && storeLocation.lon) {
        const warehouseObj = warehouses.find(
          (w) => w.lat === lat && w.lon === lon
        ) || {
          name,
          address,
          lat,
          lon,
          marker: warehouseMarker,
        };
        handleWarehouseClick(warehouseObj);
        showRoute(storeLocation.lat, storeLocation.lon, lat, lon, name);
      }
    });

    return warehouseMarker;
  };

  // Function to show route between store and warehouse
  const showRoute = (
    storeLat,
    storeLon,
    warehouseLat,
    warehouseLon,
    warehouseName
  ) => {
    // Remove existing routing control
    if (routingControl) {
      mapInstanceRef.current.removeControl(routingControl);
    }

    // Create new routing control
    const newRoutingControl = L.Routing.control({
      waypoints: [
        L.latLng(warehouseLat, warehouseLon),
        L.latLng(storeLat, storeLon),
      ],
      routeWhileDragging: false,
      showAlternatives: true,
      lineOptions: {
        styles: [{ color: "#3388ff", weight: 6, opacity: 0.7 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      altLineOptions: {
        styles: [{ color: "#96C7F6", weight: 4, opacity: 0.6 }],
      },
      createMarker: function () {
        return null;
      }, // Don't create additional markers
    }).addTo(mapInstanceRef.current);

    setRoutingControl(newRoutingControl);

    // Get route information when route is found
    newRoutingControl.on("routesfound", function (event) {
      const route = event.routes[0];
      const durationInMinutes = Math.round(route.summary.totalTime / 60);
      const distanceInKm = (route.summary.totalDistance / 1000).toFixed(2);

      // Update route info state
      setRouteInfo({
        warehouseName: warehouseName,
        distance: distanceInKm,
        time: durationInMinutes,
      });

      // Create a more detailed popup
      const popupContent = `
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; font-weight: bold; color: #3388ff;">Delivery Details</h4>
          <div style="margin-bottom: 5px;"><b>Time:</b> ${durationInMinutes} minutes</div>
          <div style="margin-bottom: 5px;"><b>Distance:</b> ${distanceInKm} km</div>
          <div style="margin-bottom: 5px;"><b>From:</b> ${warehouseName}</div>
        </div>
      `;

      // Create a popup in the middle of the route
      const middleIndex = Math.floor(route.coordinates.length / 2);
      const middlePoint = route.coordinates[middleIndex];

      L.popup()
        .setLatLng([middlePoint.lat, middlePoint.lng])
        .setContent(popupContent)
        .openOn(mapInstanceRef.current);
    });

    // Handle errors
    newRoutingControl.on("routingerror", (e) => {
      console.error("Routing error:", e);
      setError(
        "There was a problem calculating the route. Please try again later."
      );
    });
  };

  // Handle setting the store location
  const handleSetStoreLocation = async () => {
    if (!storeLocation.name.trim() || !storeLocation.address.trim()) {
      setError("Please provide both store name and address.");
      return;
    }

    setIsLoading(true);
    const locationData = await geocodeAddress(storeLocation.address);

    if (locationData) {
      // Update store location with geocoded data
      const updatedStoreLocation = {
        ...storeLocation,
        lat: locationData.lat,
        lon: locationData.lon,
        address: locationData.displayName || storeLocation.address,
      };

      setStoreLocation(updatedStoreLocation);
      setIsStoreSet(true);
      setError("");

      // Remove old marker if exists
      if (storeMarker) {
        storeMarker.remove();
      }

      // Add new store marker
      const marker = L.marker([locationData.lat, locationData.lon])
        .addTo(mapInstanceRef.current)
        .bindPopup(
          `<b>${storeLocation.name}</b><br/>${
            locationData.displayName || storeLocation.address
          }`
        )
        .openPopup();

      setStoreMarker(marker);

      // Focus map on new store location
      mapInstanceRef.current.setView([locationData.lat, locationData.lon], 12);

      // Clear any existing routes
      if (routingControl) {
        mapInstanceRef.current.removeControl(routingControl);
        setRoutingControl(null);
      }
    }
    setIsLoading(false);
  };

  // Handle adding a warehouse
  const handleAddWarehouse = async () => {
    if (!warehouseName.trim() || !warehouseAddress.trim()) {
      setError("Please provide both warehouse name and address.");
      return;
    }

    setIsLoading(true);
    const locationData = await geocodeAddress(warehouseAddress);

    if (locationData) {
      // Add marker for new warehouse
      const marker = addWarehouseMarker(
        locationData.lat,
        locationData.lon,
        warehouseName,
        locationData.displayName || warehouseAddress
      );

      // Create new warehouse object
      const newWarehouse = {
        name: warehouseName,
        address: locationData.displayName || warehouseAddress,
        lat: locationData.lat,
        lon: locationData.lon,
        marker: marker,
        products: sampleProducts.map((product) => ({
          ...product,
          quantity: Math.floor(Math.random() * 100) + 10,
        })),
      };

      setWarehouses((prevWarehouses) => [...prevWarehouses, newWarehouse]);
      setWarehouseName("");
      setWarehouseAddress("");
      setError("");
    }
    setIsLoading(false);
  };

  // Legacy handleAddLocation to maintain compatibility with your UI
  const handleAddLocation = async () => {
    if (!formData.name || !formData.location) return;

    const encodedAddress = encodeURIComponent(formData.location);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`
    );
    const data = await response.json();

    if (data.length > 0) {
      const { lat, lon } = data[0];

      if (popupType === "store") {
        // Remove old store marker if exists
        if (storeMarker) {
          storeMarker.remove();
        }

        const marker = L.marker([lat, lon])
          .addTo(mapInstanceRef.current)
          .bindPopup(formData.name)
          .openPopup();

        const storeObj = {
          name: formData.name,
          address: formData.location,
          lat,
          lon,
        };

        setStoreLocation(storeObj);
        setStoreMarker(marker);
        setIsStoreSet(true);

        // Add click handler to store marker
        marker.on("click", () => {
          if (warehouses.length > 0) {
            // Find nearest warehouse
            let nearest = warehouses[0];
            let minDist = calculateDistance(lat, lon, nearest.lat, nearest.lon);

            warehouses.forEach((wh) => {
              const dist = calculateDistance(lat, lon, wh.lat, wh.lon);
              if (dist < minDist) {
                minDist = dist;
                nearest = wh;
              }
            });

            handleWarehouseClick(nearest);
            showRoute(lat, lon, nearest.lat, nearest.lon, nearest.name);
          }
        });
      } else {
        // Adding a warehouse
        const marker = L.marker([lat, lon])
          .addTo(mapInstanceRef.current)
          .bindPopup(formData.name)
          .openPopup();

        const newWarehouse = {
          name: formData.name,
          address: formData.location,
          lat,
          lon,
          marker,
          products: sampleProducts.map((product) => ({
            ...product,
            quantity: Math.floor(Math.random() * 100) + 10,
          })),
        };

        setWarehouses([...warehouses, newWarehouse]);

        // Add click handler to warehouse marker
        marker.on("click", () => {
          handleWarehouseClick(newWarehouse);
          if (storeLocation.lat && storeLocation.lon) {
            showRoute(
              storeLocation.lat,
              storeLocation.lon,
              lat,
              lon,
              newWarehouse.name
            );
          }
        });
      }
    }

    setPopupType(null);
    setFormData({ name: "", location: "" });
  };

  const handleWarehouseClick = (warehouse) => {
    setSelectedWarehouse(warehouse);
    
    // Fetch products from the sheet_data endpoint
    fetchWarehouseProducts(warehouse);
    
    // Update route if store location is set
    if (storeLocation.lat && storeLocation.lon) {
      showRoute(
        storeLocation.lat,
        storeLocation.lon,
        warehouse.lat,
        warehouse.lon,
        warehouse.name
      );
    }
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Add this function to load products from a specific sheet URL
  const loadProductsFromSheet = (sheetUrl) => {
    setIsLoadingProducts(true);
    setError("");
    
    fetch("http://127.0.0.1:5000/sheet_data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sheet_url: sheetUrl }),
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || `HTTP error! Status: ${response.status}`);
          });
        }
        return response.json();
      })
      .then(data => {
        if (data && Array.isArray(data.data)) {
          const products = data.data.map((item, index) => ({
            id: index + 1,
            name: item.Products || "Unknown Product",
            quantity: parseInt(item.Stock) || 0,
            price: parseFloat(item["Sell Price"] || 0)
          }));
          
          setWarehouseProducts(products);
        } else {
          throw new Error("Invalid data format received from server");
        }
      })
      .catch(error => {
        console.error("Error loading products:", error);
        setError(`Failed to load products: ${error.message}`);
        setWarehouseProducts([]);
      })
      .finally(() => {
        setIsLoadingProducts(false);
      });
  };

  // Add this function to fetch products from the sheet_data endpoint
  const fetchWarehouseProducts = (warehouse) => {
    setIsLoadingProducts(true);
    setError(""); // Clear any previous errors
    
    const sheetUrl = warehouse.sheetUrl || warehouseSheets[warehouse.name] || "";
    
    if (!sheetUrl) {
      // Don't show error, just use fallback data silently
      setIsLoadingProducts(false);
      
      // Fall back to demo data if no sheet URL
      if (warehouse.products && warehouse.products.length > 0) {
        setWarehouseProducts(warehouse.products);
      } else {
        setWarehouseProducts([]);
      }
      return;
    }
    
    fetch("http://127.0.0.1:5000/sheet_data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sheet_url: sheetUrl
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data && Array.isArray(data.data)) {
          // Format the data for our table
          const products = data.data.map((item, index) => ({
            id: index + 1,
            name: item.Products || "Unknown Product",
            quantity: parseInt(item.Stock) || 0,
            price: parseFloat(item["Sell Price"] || 0)
          }));
          
          setWarehouseProducts(products);
        } else {
          throw new Error("Invalid data format");
        }
      })
      .catch(error => {
        console.error("Error fetching products:", error);
        // Don't set the error message, silently fall back to demo data
        
        // Fall back to demo data if API fails
        if (warehouse.products && warehouse.products.length > 0) {
          setWarehouseProducts(warehouse.products);
        } else {
          setWarehouseProducts([]);
        }
      })
      .finally(() => {
        setIsLoadingProducts(false);
      });
  };

  // Function to handle product purchase and transfer between sheets
  const purchaseProduct = (product, quantity, storeSheetUrl) => {
    if (!selectedWarehouse || !selectedWarehouse.sheetUrl || !storeSheetUrl) {
      setError("Missing warehouse or store information");
      return Promise.reject("Missing warehouse or store information");
    }
  
    setIsLoading(true);
    
    return fetch("http://127.0.0.1:5000/transfer_product", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_name: product.name,
        quantity: quantity,
        warehouse_sheet_url: selectedWarehouse.sheetUrl,
        store_sheet_url: storeSheetUrl,
      }),
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || `HTTP error! Status: ${response.status}`);
          });
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          // Update local product state to reflect the change
          const updatedProducts = warehouseProducts.map(p => {
            if (p.id === product.id) {
              return {
                ...p,
                quantity: p.quantity - quantity
              };
            }
            return p;
          });
          
          setWarehouseProducts(updatedProducts);
          return data;
        } else {
          throw new Error(data.error || "Failed to complete transaction");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const confirmPurchase = () => {
    if (!purchaseModal.product || !selectedWarehouse) {
      setError("Cannot complete purchase. Missing product or warehouse information.");
      return;
    }
    
    // Use a default store sheet URL or get it from your state
    const storeSheetUrl = "https://docs.google.com/spreadsheets/d/14aYs1p_HCs60uDzaaoBhEutT3KuoG58uMGC__vfdo78/edit?usp=sharing";
    
    purchaseProduct(purchaseModal.product, purchaseModal.quantity, storeSheetUrl)
      .then(data => {
        alert(`Successfully purchased ${purchaseModal.quantity} units of ${purchaseModal.product.name}`);
        setPurchaseModal({ isOpen: false, product: null, quantity: 1 });
      })
      .catch(error => {
        console.error("Purchase error:", error);
        setError(`Purchase failed: ${error.message || error}`);
      });
  };

  // Keep your original UI but link it to the new functionality
  return (
    <div className="flex flex-col h-screen">
      <div className="flex h-2/5">
        {/* Top Left: Controls */}
        <div className="w-1/2 p-6 bg-gray-50 border-r border-b">
          <h2 className="text-xl font-bold mb-4">Add Locations</h2>

          {!popupType ? (
            <div className="flex space-x-4">
              <button
                className="bg-blue-500 hover:bg-blue-600 py-2 px-6 rounded text-white"
                onClick={() => setPopupType("store")}
              >
                Add Store
              </button>
              <button
                className="bg-green-500 hover:bg-green-600 py-2 px-6 rounded text-white"
                onClick={() => setPopupType("warehouse")}
              >
                Add Warehouse
              </button>
            </div>
          ) : (
            <div className="bg-white p-4 rounded shadow border">
              <h3 className="text-lg font-bold mb-2">
                {popupType === "store" ? "Add Store" : "Add Warehouse"}
              </h3>
              <input
                type="text"
                placeholder="Name"
                className="w-full border p-2 mb-2"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Location"
                className="w-full border p-2 mb-2"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
              <div className="flex justify-end space-x-2">
                <button
                  className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                  onClick={() => setPopupType(null)}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white"
                  onClick={handleAddLocation}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Route Information */}
          {routeInfo && (
            <div className="mt-4 p-4 bg-blue-100 rounded border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Route Information
              </h3>
              <p>
                From:{" "}
                <span className="font-medium">{routeInfo.warehouseName}</span>
              </p>
              <p>
                Distance:{" "}
                <span className="font-medium">{routeInfo.distance} km</span>
              </p>
              <p>
                Estimated delivery time:{" "}
                <span className="font-medium">{routeInfo.time} minutes</span>
              </p>
            </div>
          )}
        </div>

        {/* Top Right: Warehouse List */}
        <div className="w-1/2 p-6 bg-gray-50 border-b">
          <h2 className="text-xl font-bold mb-4">Warehouses</h2>
          {warehouses.length === 0 ? (
            <p className="text-gray-500">No warehouses added yet</p>
          ) : (
            <ul className="divide-y">
              {warehouses.map((warehouse, index) => (
                <li
                  key={index}
                  className={`py-3 px-4 cursor-pointer hover:bg-gray-100 ${
                    selectedWarehouse?.name === warehouse.name
                      ? "bg-blue-100"
                      : ""
                  }`}
                  onClick={() => {
                    handleWarehouseClick(warehouse);
                    if (storeLocation.lat && storeLocation.lon) {
                      showRoute(
                        storeLocation.lat,
                        storeLocation.lon,
                        warehouse.lat,
                        warehouse.lon,
                        warehouse.name
                      );
                    }
                  }}
                >
                  <div className="font-medium">{warehouse.name}</div>
                  <div className="text-sm text-gray-500">
                    {warehouse.address}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-1">
        {/* Bottom Left: Map */}
        <div className="w-1/2 border-r">
          <div ref={mapRef} className="w-full h-full" />
        </div>

        {/* Bottom Right: Product Details */}
        <div className="w-1/2 p-6">
          <h2 className="text-xl font-bold mb-4">
            {selectedWarehouse
              ? `Products in ${selectedWarehouse.name}`
              : "Select a warehouse to view products"}
          </h2>
          <div
            className="overflow-y-auto"
            style={{ height: "calc(100% - 3rem)" }}
          >
            {selectedWarehouse ? (
              warehouseProducts.length > 0 ? (
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left font-medium">
                        Product
                      </th>
                      <th className="py-3 px-4 text-right font-medium">
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouseProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">{product.name}</td>
                        <td className="py-3 px-4 text-right">
                          {product.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">No products in this warehouse</p>
              )
            ) : (
              <p className="text-gray-500">
                Select a warehouse to view products
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapsTest;
