import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const WarehouseDashboard = () => {
  // State to track active view (overview or specific warehouse)
  const [activeView, setActiveView] = useState('overview');
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  // Hardcoded warehouse data
  const warehouseData = {
    "warehouse1": {
      name: "Warehouse 1",
      monthlyCosts: [
        { month: 'Jan', electricity: 3200, fuel: 1800, emissions: 42, employeeCount: 24, workHoursPerEmployee: 160 },
        { month: 'Feb', electricity: 2900, fuel: 1700, emissions: 38, employeeCount: 24, workHoursPerEmployee: 152 },
        { month: 'Mar', electricity: 3100, fuel: 1900, emissions: 41, employeeCount: 25, workHoursPerEmployee: 168 },
        { month: 'Apr', electricity: 3400, fuel: 2100, emissions: 45, employeeCount: 25, workHoursPerEmployee: 160 },
        { month: 'May', electricity: 3800, fuel: 2300, emissions: 48, employeeCount: 26, workHoursPerEmployee: 176 },
        { month: 'Jun', electricity: 4200, fuel: 2500, emissions: 52, employeeCount: 26, workHoursPerEmployee: 168 }
      ],
      totalMetrics: {
        electricity: 20600,
        fuel: 12300,
        emissions: 266,
        productivity: 87,
        efficiency: 92
      }
    },
    "warehouse2": {
      name: "Warehouse 2",
      monthlyCosts: [
        { month: 'Jan', electricity: 4100, fuel: 2200, emissions: 50, employeeCount: 32, workHoursPerEmployee: 168 },
        { month: 'Feb', electricity: 3900, fuel: 2000, emissions: 48, employeeCount: 32, workHoursPerEmployee: 160 },
        { month: 'Mar', electricity: 4000, fuel: 2100, emissions: 49, employeeCount: 34, workHoursPerEmployee: 176 },
        { month: 'Apr', electricity: 4300, fuel: 2300, emissions: 53, employeeCount: 34, workHoursPerEmployee: 168 },
        { month: 'May', electricity: 4600, fuel: 2500, emissions: 56, employeeCount: 35, workHoursPerEmployee: 184 },
        { month: 'Jun', electricity: 4900, fuel: 2700, emissions: 59, employeeCount: 35, workHoursPerEmployee: 176 }
      ],
      totalMetrics: {
        electricity: 25800,
        fuel: 13800,
        emissions: 315,
        productivity: 81,
        efficiency: 85
      }
    },
    "warehouse3": {
      name: "Warehouse 3",
      monthlyCosts: [
        { month: 'Jan', electricity: 2800, fuel: 1500, emissions: 36, employeeCount: 20, workHoursPerEmployee: 152 },
        { month: 'Feb', electricity: 2600, fuel: 1400, emissions: 34, employeeCount: 20, workHoursPerEmployee: 144 },
        { month: 'Mar', electricity: 2700, fuel: 1450, emissions: 35, employeeCount: 22, workHoursPerEmployee: 160 },
        { month: 'Apr', electricity: 2900, fuel: 1600, emissions: 38, employeeCount: 22, workHoursPerEmployee: 152 },
        { month: 'May', electricity: 3100, fuel: 1700, emissions: 41, employeeCount: 24, workHoursPerEmployee: 168 },
        { month: 'Jun', electricity: 3300, fuel: 1800, emissions: 43, employeeCount: 24, workHoursPerEmployee: 160 }
      ],
      totalMetrics: {
        electricity: 17400,
        fuel: 9450,
        emissions: 227,
        productivity: 93,
        efficiency: 90
      }
    }
  };

  // Aggregated data for the overview
  const overviewData = Object.keys(warehouseData).map(key => ({
    name: warehouseData[key].name,
    electricity: warehouseData[key].totalMetrics.electricity,
    fuel: warehouseData[key].totalMetrics.fuel,
    emissions: warehouseData[key].totalMetrics.emissions,
    productivity: warehouseData[key].totalMetrics.productivity,
    efficiency: warehouseData[key].totalMetrics.efficiency
  }));

  // Set up KPI comparison data
  const kpiComparisonData = [
    { name: 'Electricity Cost ($)', warehouse1: warehouseData.warehouse1.totalMetrics.electricity, warehouse2: warehouseData.warehouse2.totalMetrics.electricity, warehouse3: warehouseData.warehouse3.totalMetrics.electricity },
    { name: 'Fuel Consumption ($)', warehouse1: warehouseData.warehouse1.totalMetrics.fuel, warehouse2: warehouseData.warehouse2.totalMetrics.fuel, warehouse3: warehouseData.warehouse3.totalMetrics.fuel },
    { name: 'Emissions (tons)', warehouse1: warehouseData.warehouse1.totalMetrics.emissions, warehouse2: warehouseData.warehouse2.totalMetrics.emissions, warehouse3: warehouseData.warehouse3.totalMetrics.emissions },
  ];

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  // Handler for warehouse selection
  const handleWarehouseSelect = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setActiveView('detail');
  };

  // Handler for view change
  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === 'overview') {
      setSelectedWarehouse(null);
    }
  };

  // Calculate efficiency metrics for a specific warehouse
  const calculateEfficiency = (warehouseKey) => {
    const warehouse = warehouseData[warehouseKey];
    const monthlyData = warehouse.monthlyCosts;
    
    return monthlyData.map(month => ({
      month: month.month,
      hoursPerEmployee: month.workHoursPerEmployee,
      totalHours: month.workHoursPerEmployee * month.employeeCount,
      employeeCount: month.employeeCount
    }));
  };

  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Warehouse Analytics Dashboard</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => handleViewChange('overview')}
                className={`px-4 py-2 rounded-md ${
                  activeView === 'overview'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Overview
              </button>
              <select
                onChange={(e) => handleWarehouseSelect(e.target.value)}
                value={selectedWarehouse || ''}
                className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 border-0"
              >
                <option value="" disabled>Select Warehouse</option>
                {Object.keys(warehouseData).map((key) => (
                  <option key={key} value={key}>
                    {warehouseData[key].name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Overview View */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.keys(warehouseData).map((key) => (
                <div 
                  key={key}
                  className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleWarehouseSelect(key)}
                >
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">{warehouseData[key].name}</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Electricity:</span>
                      <span className="font-medium">{formatCurrency(warehouseData[key].totalMetrics.electricity)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fuel:</span>
                      <span className="font-medium">{formatCurrency(warehouseData[key].totalMetrics.fuel)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Emissions:</span>
                      <span className="font-medium">{warehouseData[key].totalMetrics.emissions} tons</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Productivity:</span>
                      <span className="font-medium">{warehouseData[key].totalMetrics.productivity}%</span>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${warehouseData[key].totalMetrics.efficiency}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {warehouseData[key].totalMetrics.efficiency}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Efficiency Rating</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Comparison Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cost Comparison Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Cost Comparison</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={kpiComparisonData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="warehouse1" name="Warehouse 1" fill="#0088FE" />
                      <Bar dataKey="warehouse2" name="Warehouse 2" fill="#00C49F" />
                      <Bar dataKey="warehouse3" name="Warehouse 3" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Efficiency Rating Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Efficiency & Productivity</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={overviewData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="productivity" name="Productivity %" fill="#8884d8" />
                      <Bar dataKey="efficiency" name="Efficiency %" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Emissions Comparison */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Emissions Comparison</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overviewData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="emissions"
                    >
                      {overviewData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} tons`, 'Emissions']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Warehouse Detail View */}
        {activeView === 'detail' && selectedWarehouse && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  {warehouseData[selectedWarehouse].name} - Detailed Analysis
                </h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  6 Month Period
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Electricity Cost</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(warehouseData[selectedWarehouse].totalMetrics.electricity)}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Fuel Cost</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(warehouseData[selectedWarehouse].totalMetrics.fuel)}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Emissions</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {warehouseData[selectedWarehouse].totalMetrics.emissions} tons
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly Cost Trends */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Cost Trends</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={warehouseData[selectedWarehouse].monthlyCosts}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'emissions' ? `${value} tons` : formatCurrency(value),
                      name.charAt(0).toUpperCase() + name.slice(1)
                    ]} />
                    <Legend />
                    <Line type="monotone" dataKey="electricity" stroke="#0088FE" name="Electricity" />
                    <Line type="monotone" dataKey="fuel" stroke="#00C49F" name="Fuel" />
                    <Line type="monotone" dataKey="emissions" stroke="#FF8042" name="Emissions" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Workforce & Efficiency */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Workforce Metrics</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={warehouseData[selectedWarehouse].monthlyCosts}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="employeeCount" name="Employee Count" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="workHoursPerEmployee" name="Work Hours/Employee" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Cost Breakdown</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Electricity', value: warehouseData[selectedWarehouse].totalMetrics.electricity },
                          { name: 'Fuel', value: warehouseData[selectedWarehouse].totalMetrics.fuel }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#0088FE" />
                        <Cell fill="#00C49F" />
                      </Pie>
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Cost']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Efficiency Analysis */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Efficiency Analysis</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={calculateEfficiency(selectedWarehouse)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="hoursPerEmployee" name="Hours per Employee" stroke="#8884d8" />
                    <Line type="monotone" dataKey="employeeCount" name="Employee Count" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseDashboard;