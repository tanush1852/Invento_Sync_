import React, { useState, useEffect } from "react";
import { fetchSheetData } from "../../service/api";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Label,
  Area,
} from "recharts";

const Dashboard = ({ jsonData = null }) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sheetUrl, setSheetUrl] = useState("https://docs.google.com/spreadsheets/d/14aYs1p_HCs60uDzaaoBhEutT3KuoG58uMGC__vfdo78/edit?gid=0#gid=0");

  // Sample data as fallback in case API fails
  const sampleData = [
    {
      "Products": "Fairy Lights",
      "Date": "03-08-2025",
      "Expiry Days": 5,
      "Stock": 2500,
      "Cost Price": 250,
      "Sell Price": 300,
      "Sales Quantity": 200,
      "Profit": 60000,
      "Low Threshold": 100,
      "High Threshold": 5000,
    },
    {
      "Products": "Protein Shake",
      "Date": "03-08-2025",
      "Expiry Days": 180,
      "Stock": 1200,
      "Cost Price": 900,
      "Sell Price": 1000,
      "Sales Quantity": 50,
      "Profit": 50000,
      "Low Threshold": 20,
      "High Threshold": 4000,
    },
    {
      "Products": "Chocolate",
      "Date": "03-08-2025",
      "Expiry Days": 50,
      "Stock": 4500,
      "Cost Price": 40,
      "Sell Price": 50,
      "Sales Quantity": 600,
      "Profit": 30000,
      "Low Threshold": 10,
      "High Threshold": 10000,
    },
    {
      "Products": "Facewash",
      "Date": "03-08-2025",
      "Expiry Days": 120,
      "Stock": 800,
      "Cost Price": 200,
      "Sell Price": 250,
      "Sales Quantity": 30,
      "Profit": 7500,
      "Low Threshold": 50,
      "High Threshold": 1000,
    },
    {
      "Products": "Fairy LG",
      "Date": "03-08-2025",
      "Expiry Days": 200,
      "Stock": 3000,
      "Cost Price": 250,
      "Sell Price": 300,
      "Sales Quantity": 400,
      "Profit": 60000,
      "Low Threshold": 100,
      "High Threshold": 5000,
    },
    
    {
      "Products": "Electric Car",
      "Date": "03-08-2025",
      "Expiry Days": 50,
      "Stock": 30,
      "Cost Price": 400,
      "Sell Price": 2000,
      "Sales Quantity": 0,
      "Profit": 0,
      "Low Threshold": 2,
      "High Threshold": 10,
    },
    {
      "Products": "Electric Car",
      "Date": "03-08-2025",
      "Expiry Days": 50,
      "Stock": 20,
      "Cost Price": 400,
      "Sell Price": 2000,
      "Sales Quantity": 0,
      "Profit": 0,
      "Low Threshold": 1,
      "High Threshold": 20,
    },
  ];

  useEffect(() => {
    // If JSON data is provided as a prop, use it
    if (jsonData) {
      processData(jsonData);
    } else {
      // Otherwise, fetch data from the API
      setIsLoading(true);
      fetchSheetData(sheetUrl)
        .then(apiData => {
          if (apiData && apiData.length > 0) {
            processData(apiData);
          } else {
            // Fallback to sample data if API returns empty result
            processData(sampleData);
          }
        })
        .catch(err => {
          console.error("Error fetching data:", err);
          setError("Failed to fetch data from API. Using sample data instead.");
          processData(sampleData); // Fallback to sample data on error
        });
    }
  }, [jsonData, sheetUrl]);

  const processData = (rawData) => {
    try {
      // Process data to combine duplicates
      const uniqueProducts = {};
      rawData.forEach((item) => {
        if (!uniqueProducts[item.Products]) {
          uniqueProducts[item.Products] = { ...item };
        } else {
          // For duplicates, combine the values
          uniqueProducts[item.Products].Stock += item.Stock;
          // You might want to adjust other fields as needed
        }
      });

      setData(Object.values(uniqueProducts));
      setIsLoading(false);
    } catch (err) {
      setError("Error processing data");
      setIsLoading(false);
      console.error("Data processing error:", err);
    }
  };

  // Calculate inventory-specific metrics
  const calculateInventoryMetrics = () => {
    if (!data.length) return {};

    // Identify products below low threshold
    const lowStockProducts = data.filter(
      (item) => item.Stock <= item["Low Threshold"]
    );

    // Identify products above high threshold
    const highStockProducts = data.filter(
      (item) => item.Stock >= item["High Threshold"]
    );

    // Products expiring soon (in the next 7 days)
    const expiringProducts = data
      .filter((item) => item["Expiry Days"] <= 7)
      .sort((a, b) => a["Expiry Days"] - b["Expiry Days"]);

    // Calculate inventory value
    const totalInventoryValue = data.reduce(
      (sum, item) => sum + item.Stock * item["Cost Price"],
      0
    );

    // Calculate potential revenue
    const potentialRevenue = data.reduce(
      (sum, item) => sum + item.Stock * item["Sell Price"],
      0
    );

    // Calculate potential profit
    const potentialProfit = potentialRevenue - totalInventoryValue;

    // Calculate inventory turnover ratio (if we assume the sales are monthly)
    // Inventory Turnover = Cost of Goods Sold / Average Inventory
    const costOfGoodsSold = data.reduce(
      (sum, item) => sum + item["Sales Quantity"] * item["Cost Price"],
      0
    );
    const inventoryTurnover = costOfGoodsSold / (totalInventoryValue || 1); // Avoid division by zero

    // Calculate days of supply for each product based on sales rate
    const daysOfSupply = data
      .map((item) => {
        const dailySalesRate = item["Sales Quantity"] / 30; // Assuming monthly sales
        const days =
          dailySalesRate > 0
            ? Math.round(item.Stock / dailySalesRate)
            : Infinity;
        return {
          product: item.Products,
          daysOfSupply: days === Infinity ? "∞" : days,
          stock: item.Stock,
          salesQuantity: item["Sales Quantity"],
        };
      })
      .sort((a, b) => {
        // Sort by numeric days, putting Infinity at the end
        if (a.daysOfSupply === "∞" && b.daysOfSupply === "∞") return 0;
        if (a.daysOfSupply === "∞") return 1;
        if (b.daysOfSupply === "∞") return -1;
        return a.daysOfSupply - b.daysOfSupply;
      });

    // Dead stock (items with zero sales)
    const deadStock = data.filter((item) => item["Sales Quantity"] === 0);

    // Profit margin for each product
    const profitMargins = data.map((item) => ({
      product: item.Products,
      margin: (
        ((item["Sell Price"] - item["Cost Price"]) / item["Sell Price"]) *
        100
      ).toFixed(2),
      revenue: item["Sales Quantity"] * item["Sell Price"],
    }));

    return {
      lowStockProducts,
      highStockProducts,
      expiringProducts,
      totalInventoryValue,
      potentialRevenue,
      potentialProfit,
      inventoryTurnover,
      daysOfSupply,
      deadStock,
      profitMargins,
    };
  };

  // Custom tooltip component for better styling
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-md">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-₹{index}`} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Prepare data for price comparison scatter plot
  const priceComparisonData = data.map((item) => ({
    name: item.Products,
    x: item["Cost Price"],
    y: item["Sell Price"],
  }));

  // Colors palette for the charts
  const COLORS = [
    "#4C6EF5",
    "#F3746E",
    "#38D39F",
    "#FFCE56",
    "#9C7BD8",
    "#FF9F40",
  ];

  const processForecastData = () => {
    // Historical data points for Chocolate and Fairy Lights
    const chocolateHistorical = [
      10865, 10243, 9984, 9765, 9543, 9321, 9132, 8976,
    ];
    const fairyLightsHistorical = [1998, 2321, 2543, 524, 495, 487, 467, 478];

    // Forecast data for Chocolate
    const chocolateForecast = [
      {
        date: "2025-03-09",
        yhat: 9001.68,
        yhat_lower: 8636.05,
        yhat_upper: 9352.08,
      },
      {
        date: "2025-03-16",
        yhat: 9077.23,
        yhat_lower: 8752.24,
        yhat_upper: 9455.15,
      },
      {
        date: "2025-03-23",
        yhat: 9166.31,
        yhat_lower: 8824.56,
        yhat_upper: 9516.13,
      },
      {
        date: "2025-03-30",
        yhat: 9245.16,
        yhat_lower: 8882.36,
        yhat_upper: 9614.1,
      },
    ];

    // Forecast data for Fairy Lights
    const fairyLightsForecast = [
      {
        date: "2025-03-09",
        yhat: 552.25,
        yhat_lower: 479.2,
        yhat_upper: 620.91,
      },
      {
        date: "2025-03-16",
        yhat: 573.76,
        yhat_lower: 501.84,
        yhat_upper: 641.56,
      },
      {
        date: "2025-03-23",
        yhat: 568.37,
        yhat_lower: 493.14,
        yhat_upper: 639.9,
      },
      {
        date: "2025-03-30",
        yhat: 560.73,
        yhat_lower: 485.14,
        yhat_upper: 632.57,
      },
    ];

    // Generate dates for historical data (8 weeks before first forecast)
    const startDate = new Date("2025-03-09");
    const historicalDates = [];

    for (let i = 8; i > 0; i--) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() - i * 7);
      historicalDates.push(date.toISOString().split("T")[0]);
    }

    // Combine into a single dataset
    const combinedData = [];

    // Add historical data
    for (let i = 0; i < historicalDates.length; i++) {
      combinedData.push({
        date: historicalDates[i],
        chocolateActual: chocolateHistorical[i],
        fairyLightsActual: fairyLightsHistorical[i],
      });
    }

    // Add forecast data
    for (let i = 0; i < chocolateForecast.length; i++) {
      combinedData.push({
        date: chocolateForecast[i].date,
        chocolateForecast: chocolateForecast[i].yhat,
        fairyLightsForecast: fairyLightsForecast[i].yhat,
      });
    }

    return combinedData;
  };

  const forecastData = processForecastData();

  // If still loading, show a loading spinner
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  // If there was an error loading the data
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  // Calculate all inventory metrics
  const inventoryMetrics = calculateInventoryMetrics();

  const generateFinancialReport = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/generate-financial-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sheet_url: sheetUrl }),
      });
      
      if (!response.ok) throw new Error('Failed to generate report');
      
      const result = await response.json();
      
      if (result.success) {
        alert('Financial report generated successfully!');
        // You could also add logic to display the report or provide a download link
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate financial report. Please try again.');
    }
  };

  return (
    <div className="bg-gray-50 p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Product Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Interactive visualization of product performance metrics
          </p>
        </header>

        {/* Inventory Alerts Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            Inventory Alerts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Low Stock Alert */}
            <div
              className={`p-4 rounded-lg ${
                inventoryMetrics.lowStockProducts.length > 0
                  ? "bg-red-50 border border-red-200"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <h3
                className={`${
                  inventoryMetrics.lowStockProducts.length > 0
                    ? "text-red-600"
                    : "text-green-600"
                } font-medium mb-2 flex items-center`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Low Stock Alert
              </h3>
              {inventoryMetrics.lowStockProducts.length > 0 ? (
                <div className="max-h-40 overflow-y-auto">
                  {inventoryMetrics.lowStockProducts.map((product, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-700 py-1 border-b border-gray-100 last:border-b-0"
                    >
                      <span className="font-semibold">{product.Products}</span>:{" "}
                      {product.Stock} units
                      <span className="ml-2 text-xs text-red-500 font-medium">
                        (Below threshold of {product["Low Threshold"]})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-700">
                  All products above minimum threshold.
                </p>
              )}
            </div>

            {/* Overstocked Alert */}
            <div
              className={`p-4 rounded-lg ${
                inventoryMetrics.highStockProducts.length > 0
                  ? "bg-yellow-50 border border-yellow-200"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <h3
                className={`${
                  inventoryMetrics.highStockProducts.length > 0
                    ? "text-yellow-600"
                    : "text-green-600"
                } font-medium mb-2 flex items-center`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Overstocked Alert
              </h3>
              {inventoryMetrics.highStockProducts.length > 0 ? (
                <div className="max-h-40 overflow-y-auto">
                  {inventoryMetrics.highStockProducts.map((product, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-700 py-1 border-b border-gray-100 last:border-b-0"
                    >
                      <span className="font-semibold">{product.Products}</span>:{" "}
                      {product.Stock.toLocaleString()} units
                      <span className="ml-2 text-xs text-yellow-500 font-medium">
                        (Above threshold of{" "}
                        {product["High Threshold"].toLocaleString()})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-700">
                  All products below maximum threshold.
                </p>
              )}
            </div>

            {/* Expiring Soon Alert */}
            <div
              className={`p-4 rounded-lg ${
                inventoryMetrics.expiringProducts.length > 0
                  ? "bg-orange-50 border border-orange-200"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <h3
                className={`${
                  inventoryMetrics.expiringProducts.length > 0
                    ? "text-orange-600"
                    : "text-green-600"
                } font-medium mb-2 flex items-center`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                Expiring Soon
              </h3>
              {inventoryMetrics.expiringProducts.length > 0 ? (
                <div className="max-h-40 overflow-y-auto">
                  {inventoryMetrics.expiringProducts.map((product, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-700 py-1 border-b border-gray-100 last:border-b-0"
                    >
                      <span className="font-semibold">{product.Products}</span>:
                      <span
                        className={`ml-2 ₹{
                          product["Expiry Days"] <= 7
                            ? "text-red-500 font-medium"
                            : "text-orange-500"
                        }`}
                      >
                        {product["Expiry Days"]}{" "}
                        {product["Expiry Days"] === 1 ? "day" : "days"}{" "}
                        remaining
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-700">
                  No products expiring within 7 days.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* First row of visualizations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Profit by Product */}
          <div className="bg-white p-6 rounded-xl shadow-md transition-shadow hover:shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-gray-700 flex items-center">
              <span className="w-3 h-8 bg-blue-500 rounded-sm mr-3"></span>
              Profit by Product
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data}
                margin={{ top: 10, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="Products"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: "#666", fontSize: 12 }}
                  tickLine={{ stroke: "#ccc" }}
                >
                  <Label
                    value="Products"
                    position="insideBottom"
                    offset={-10}
                    fill="#666"
                  />
                </XAxis>
                <YAxis
                  tick={{ fill: "#666", fontSize: 12 }}
                  tickLine={{ stroke: "#ccc" }}
                  axisLine={{ stroke: "#ccc" }}
                >
                  <Label
                    value="Profit"
                    angle={-90}
                    position="insideLeft"
                    offset={-5}
                    fill="#666"
                  />
                </YAxis>
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="Profit"
                  fill="#4C6EF5"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sales Quantity by Product */}
          <div className="bg-white p-6 rounded-xl shadow-md transition-shadow hover:shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-gray-700 flex items-center">
              <span className="w-3 h-8 bg-red-400 rounded-sm mr-3"></span>
              Sales Quantity by Product
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={data}
                margin={{ top: 10, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="Products"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: "#666", fontSize: 12 }}
                  tickLine={{ stroke: "#ccc" }}
                >
                  <Label
                    value="Products"
                    position="insideBottom"
                    offset={-10}
                    fill="#666"
                  />
                </XAxis>
                <YAxis
                  tick={{ fill: "#666", fontSize: 12 }}
                  tickLine={{ stroke: "#ccc" }}
                  axisLine={{ stroke: "#ccc" }}
                >
                  <Label
                    value="Sales Quantity"
                    angle={-90}
                    position="insideLeft"
                    offset={-5}
                    fill="#666"
                  />
                </YAxis>
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="Sales Quantity"
                  stroke="#F3746E"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "#F3746E", strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: "#F3746E" }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Second row of visualizations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Combined Product Sales Forecast (REPLACING Cost Price vs Sell Price) */}
          <div className="bg-white p-6 rounded-xl shadow-md transition-shadow hover:shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-gray-700 flex items-center">
              <span className="w-3 h-8 bg-green-400 rounded-sm mr-3"></span>
              Sales Forecast Analysis
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={forecastData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />

                  {/* Chocolate Historical - solid line */}
                  <Line
                    type="monotone"
                    dataKey="chocolateActual"
                    name="Chocolate (Historical)"
                    stroke="#8B4513"
                    strokeWidth={2}
                    connectNulls
                  />

                  {/* Chocolate Forecast - dashed line */}
                  <Line
                    type="monotone"
                    dataKey="chocolateForecast"
                    name="Chocolate (Forecast)"
                    stroke="#8B4513"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    connectNulls
                  />

                  {/* Fairy Lights Historical - solid line */}
                  <Line
                    type="monotone"
                    dataKey="fairyLightsActual"
                    name="Fairy Lights (Historical)"
                    stroke="#4682B4"
                    strokeWidth={2}
                    connectNulls
                  />

                  {/* Fairy Lights Forecast - dashed line */}
                  <Line
                    type="monotone"
                    dataKey="fairyLightsForecast"
                    name="Fairy Lights (Forecast)"
                    stroke="#4682B4"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <p>
                Historical data (solid lines) and forecasted values (dashed
                lines)
              </p>
            </div>
          </div>

          {/* Stock Distribution by Product - KEEP THIS EXISTING VISUALIZATION */}
          <div className="bg-white p-6 rounded-xl shadow-md transition-shadow hover:shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-gray-700 flex items-center">
              <span className="w-3 h-8 bg-yellow-400 rounded-sm mr-3"></span>
              Stock Distribution by Product
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="Stock"
                  nameKey="Products"
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  animationDuration={1500}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enhanced Summary statistics row */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              Inventory Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-blue-600 font-medium mb-2">Total Profit</h3>
                <p className="text-2xl font-bold text-gray-800">
                  ₹
                  {data
                    .reduce((sum, item) => sum + item.Profit, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-green-600 font-medium mb-2">Total Stock</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {data
                    .reduce((sum, item) => sum + item.Stock, 0)
                    .toLocaleString()}{" "}
                  units
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-purple-600 font-medium mb-2">
                  Total Sales
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  {data
                    .reduce((sum, item) => sum + item["Sales Quantity"], 0)
                    .toLocaleString()}{" "}
                  units
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="text-indigo-600 font-medium mb-2">
                  Inventory Value
                </h3>
                <p className="text-2xl font-bold text-gray-800">
                  ₹{inventoryMetrics.totalInventoryValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Inventory Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Financial Metrics */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              Financial Metrics
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-gray-600">Total Inventory Cost</span>
                <span className="font-semibold">
                  ₹{inventoryMetrics.totalInventoryValue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-gray-600">
                  Potential Revenue (if all sold)
                </span>
                <span className="font-semibold">
                  ₹{inventoryMetrics.potentialRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-gray-600">
                  Potential Profit (if all sold)
                </span>
                <span className="font-semibold">
                  ₹{inventoryMetrics.potentialProfit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Inventory Turnover Ratio</span>
                <span className="font-semibold">
                  {inventoryMetrics.inventoryTurnover.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Dead Stock Analysis */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              Dead Stock Analysis
            </h2>
            {inventoryMetrics.deadStock.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                <div className="text-sm text-gray-500 font-medium flex items-center">
                  <span className="w-1/2">Product</span>
                  <span className="w-1/4 text-right">Stock</span>
                  <span className="w-1/4 text-right">Value</span>
                </div>
                {inventoryMetrics.deadStock.map((item, index) => (
                  <div key={index} className="flex items-center py-2 border-b">
                    <span className="w-1/2 font-medium text-gray-700">
                      {item.Products}
                    </span>
                    <span className="w-1/4 text-right">
                      {item.Stock.toLocaleString()}
                    </span>
                    <span className="w-1/4 text-right">
                      ₹{(item.Stock * item["Cost Price"]).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 font-semibold">
                  <span>Total Dead Stock Value</span>
                  <span>
                    ₹
                    {inventoryMetrics.deadStock
                      .reduce(
                        (sum, item) => sum + item.Stock * item["Cost Price"],
                        0
                      )
                      .toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No dead stock found.</p>
            )}
          </div>
        </div>

        {/* Inventory Health & Product Supply */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Days of Supply Analysis */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              Days of Supply
            </h2>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              <div className="text-sm text-gray-500 font-medium flex items-center">
                <span className="w-1/2">Product</span>
                <span className="w-1/4 text-right">Stock</span>
                <span className="w-1/4 text-right">Days of Supply</span>
              </div>
              {inventoryMetrics.daysOfSupply.map((item, index) => (
                <div key={index} className="flex items-center py-2 border-b">
                  <span className="w-1/2 font-medium text-gray-700">
                    {item.product}
                  </span>
                  <span className="w-1/4 text-right">
                    {item.stock.toLocaleString()}
                  </span>
                  <span className="w-1/4 text-right">{item.daysOfSupply}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Profit Margins by Product */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              Profit Margins by Product
            </h2>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              <div className="text-sm text-gray-500 font-medium flex items-center">
                <span className="w-1/2">Product</span>
                <span className="w-1/4 text-right">Margin (%)</span>
                <span className="w-1/4 text-right">Revenue</span>
              </div>
              {inventoryMetrics.profitMargins.map((item, index) => (
                <div key={index} className="flex items-center py-2 border-b">
                  <span className="w-1/2 font-medium text-gray-700">
                    {item.product}
                  </span>
                  <span className="w-1/4 text-right">{item.margin}%</span>
                  <span className="w-1/4 text-right">
                    ₹{item.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={generateFinancialReport}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Generate Financial Report
          </button>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-600 mt-10">
          <p>Product Analytics Dashboard.</p>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;