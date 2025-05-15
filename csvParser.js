const axios = require('axios');
const Papa = require('papaparse');

exports.parseCsvFromUrl = async (csvUrl) => {
  try {
    const response = await axios.get(csvUrl);
    const csvText = response.data;

    const { data } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    return data;
  } catch (err) {
    console.error("Failed to fetch/parse CSV:", err.message);
    return null;
  }
};
