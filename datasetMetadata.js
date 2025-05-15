const axios = require('axios');

exports.getDatasetMetadata = async (datasetId) => {
  const url = `https://data.europa.eu/data/api/3/action/package_show?id=${datasetId}`;
  try {
    const response = await axios.get(url);
    
    if (response.data?.success) {
      return response.data.result; 
    } else {
      console.warn("Metadata not found or CKAN error");
      return null;
    }
  } catch (error) {
    console.error("Error fetching metadata:", error.message);
    return null;
  }
};
