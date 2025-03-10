import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000';

export const fetchSheetData = async (sheetUrl) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/read_sheet`, {
      sheet_url: sheetUrl
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
};