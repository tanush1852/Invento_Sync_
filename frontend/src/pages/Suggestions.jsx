import React, { useState, useEffect } from "react";
import {
  Badge,
  Calendar,
  Tooltip,
  Spin,
  Modal,
  Form,
  Input,
  Button,
  List,
  Tag,
  message,
} from "antd";
import { PlusOutlined, WarningOutlined, CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";

function Suggestions() {
  const [festivalData, setFestivalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [userItems, setUserItems] = useState({});
  const [form] = Form.useForm();
  
  // Stock data with loading state
  const [stockData, setStockData] = useState({
    high_demand_low_stock: [],
    low_demand_high_stock: []
  });
  const [stockLoading, setStockLoading] = useState(true);

  const festivals = {
    festivals: [
      {
        date: "2025-01-14",
        festival: "Makar Sankranti",
        popular_goods: [
          "Sweets (Til Laddu, Chikki)",
          "Kites",
          "Thread (Manjha)",
          "Sesame Seeds",
        ],
      },
      {
        date: "2025-01-26",
        festival: "Republic Day",
        popular_goods: [
          "National Flags",
          "Badges",
          "Books related to Indian History",
          "Sweets",
        ],
      },
      {
        date: "2025-03-14",
        festival: "Holi",
        popular_goods: [
          "Colors (Gulal)",
          "Water Guns (Pichkaris)",
          "Water Balloons",
          "Sweets (Gujiya)",
          "Snacks",
        ],
      },
      {
        date: "2025-04-13",
        festival: "Baisakhi",
        popular_goods: [
          "Sweets",
          "New Clothes",
          "Agricultural Tools (Symbolic)",
          "Dry Fruits",
        ],
      },
      {
        date: "2025-08-15",
        festival: "Independence Day",
        popular_goods: ["National Flags", "Badges", "Kites", "Sweets"],
      },
      {
        date: "2025-08-17",
        festival: "Raksha Bandhan",
        popular_goods: [
          "Rakhi",
          "Sweets",
          "Dry Fruits",
          "Gifts for Sisters",
          "Greeting Cards",
        ],
      },
      {
        date: "2025-08-25",
        festival: "Janmashtami",
        popular_goods: [
          "Krishna Idols",
          "Puja Items",
          "Sweets (Makhan Mishri)",
          "Decoration Materials",
        ],
      },
      {
        date: "2025-09-01",
        festival: "Onam",
        popular_goods: [
          "Flowers (for Pookalam)",
          "Sweets",
          "Traditional Clothing (Kasavu Saree)",
          "Banana Chips",
        ],
      },
      {
        date: "2025-10-05",
        festival: "Dussehra",
        popular_goods: [
          "Sweets (Jalebi, Fafda)",
          "Puja Items",
          "Toys (Bow & Arrow)",
          "Home Decor",
        ],
      },
      {
        date: "2025-10-31",
        festival: "Diwali",
        popular_goods: [
          "Sweets",
          "Dry Fruits",
          "Diyas & Candles",
          "Electronics",
          "Gift Items",
          "Home Decor",
        ],
      },
    ],
  };

  // Fetch inventory analysis from backend
  const fetchInventoryAnalysis = async () => {
    try {
      setStockLoading(true);
      const response = await axios.post('http://127.0.0.1:5000/analyze_inventory', {
        sheet_url: "https://docs.google.com/spreadsheets/d/14aYs1p_HCs60uDzaaoBhEutT3KuoG58uMGC__vfdo78/edit?usp=sharing"
      });
      
      setStockData({
        high_demand_low_stock: response.data.high_demand_low_stock || [],
        low_demand_high_stock: response.data.low_demand_high_stock || []
      });
    } catch (error) {
      console.error("Error fetching inventory analysis:", error);
      message.error("Failed to load inventory analysis data");
      // Set fallback data in case of error
      setStockData({
        high_demand_low_stock: ["Error loading data"],
        low_demand_high_stock: ["Error loading data"]
      });
    } finally {
      setStockLoading(false);
    }
  };

  useEffect(() => {
    // Load saved user items from localStorage
    const savedItems = localStorage.getItem("userCalendarItems");
    if (savedItems) {
      setUserItems(JSON.parse(savedItems));
    }

    // Fetch festival data
    setTimeout(() => {
      setFestivalData(festivals.festivals);
      setLoading(false);
    }, 1000);
    
    // Fetch inventory analysis
    fetchInventoryAnalysis();
  }, []);

  // Save user items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("userCalendarItems", JSON.stringify(userItems));
  }, [userItems]);

  const showModal = (date) => {
    setSelectedDate(date.format("YYYY-MM-DD"));
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSubmit = (values) => {
    const newItems = values.items
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item); // Remove empty items

    setUserItems((prev) => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), ...newItems],
    }));

    setIsModalVisible(false);
    form.resetFields();
  };

  const removeItem = (date, index) => {
    setUserItems((prev) => {
      const newItems = { ...prev };
      newItems[date] = [...newItems[date]];
      newItems[date].splice(index, 1);

      if (newItems[date].length === 0) {
        delete newItems[date];
      }

      return newItems;
    });
  };

  const getListData = (value) => {
    const dateString = value.format("YYYY-MM-DD");
    const result = [];

    // Add festival data
    const festivalInfo = festivalData.find((item) => item.date === dateString);
    if (festivalInfo) {
      result.push({
        type: "success",
        content: festivalInfo.festival,
        goods: festivalInfo.popular_goods,
        isFestival: true,
      });
    }

    // Add user items
    if (userItems[dateString] && userItems[dateString].length > 0) {
      result.push({
        type: "processing",
        content: "Shopping List",
        goods: userItems[dateString],
        isUserItem: true,
        date: dateString,
      });
    }

    return result;
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);

    return (
      <ul className="events">
        {listData.map((item, idx) => (
          <Tooltip
            key={`${item.content}-${idx}`}
            title={
              <div>
                <div className="font-bold mb-1">{item.content}</div>
                <div className="text-sm">
                  {item.isFestival ? "Popular Items:" : "Your Shopping List:"}
                </div>
                <ul className="list-disc pl-4">
                  {item.goods.map((good, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span>{good}</span>
                      {item.isUserItem && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(item.date, index);
                          }}
                        >
                          ✕
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            }
          >
            <li className="hover:bg-blue-50 rounded p-1 transition-colors">
              <Badge
                status={item.type}
                text={item.content}
                className="cursor-pointer"
              />
            </li>
          </Tooltip>
        ))}
        <li>
          <Button
            type="link"
            icon={<PlusOutlined />}
            size="small"
            className="p-0 text-blue-500 hover:text-blue-700 flex items-center"
            onClick={() => showModal(value)}
          >
            <span className="text-xs ml-1">Add</span>
          </Button>
        </li>
      </ul>
    );
  };

  const cellRender = (current, info) => {
    if (info.type === "date") return dateCellRender(current);
    return info.originNode;
  };

  return (
    <div className="flex h-screen w-full bg-gray-50">
      {/* Left Column - contains sections 1 and 2 */}
      <div className="flex flex-col w-1/2 h-full p-4 space-y-4">
        {/* Section 1 - Top left */}
        <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
            <WarningOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
            High Demand / Low Stock
          </h2>
          <div className="text-gray-600 mb-4">
            These items are running low but have high customer demand. Consider restocking soon.
          </div>
          {stockLoading ? (
            <div className="flex justify-center items-center h-32">
              <Spin />
            </div>
          ) : (
            <List
              dataSource={stockData.high_demand_low_stock}
              renderItem={(item) => (
                <List.Item className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-gray-800">{item}</span>
                  </div>
                  <Tag color="red">Low Stock</Tag>
                </List.Item>
              )}
              bordered
              className="shadow-sm"
              locale={{ emptyText: "No items to display" }}
            />
          )}
        </div>

        {/* Section 2 - Bottom left */}
        <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
            Low Demand / High Stock
          </h2>
          <div className="text-gray-600 mb-4">
            These items have ample stock but lower customer interest. Consider promotions or bundling.
          </div>
          {stockLoading ? (
            <div className="flex justify-center items-center h-32">
              <Spin />
            </div>
          ) : (
            <List
              dataSource={stockData.low_demand_high_stock}
              renderItem={(item) => (
                <List.Item className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-gray-800">{item}</span>
                  </div>
                  <Tag color="green">High Stock</Tag>
                </List.Item>
              )}
              bordered
              className="shadow-sm"
              locale={{ emptyText: "No items to display" }}
            />
          )}
        </div>
      </div>

      {/* Section 3 - Calendar on right side */}
      <div className="w-1/2 h-full bg-white rounded-lg shadow-sm m-4 p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Festival Calendar
        </h2>
        <p className="text-gray-500 mb-4">
          View upcoming festivals and add your own shopping lists for specific
          dates.
        </p>
        {loading ? (
          <div className="flex justify-center items-center h-[calc(100%-3rem)]">
            <Spin size="large" />
          </div>
        ) : (
          <Calendar cellRender={cellRender} className="festival-calendar" />
        )}
      </div>

      {/* Modal for adding items */}
      <Modal
        title={`Add Items for ${selectedDate}`}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit}>
          <Form.Item
            name="items"
            label="Items to buy"
            rules={[{ required: true, message: "Please enter items" }]}
          >
            <Input.TextArea
              placeholder="Enter items separated by commas (e.g., Milk, Bread, Eggs)"
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </Form.Item>
          <Form.Item>
            <div className="flex justify-end">
              <Button onClick={handleCancel} className="mr-2">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Add Items
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Suggestions;
