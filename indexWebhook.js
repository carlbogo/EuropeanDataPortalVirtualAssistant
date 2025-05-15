
// indexWebhook.js
const { queryDatasetsJson } = require('./dataHandler');
const { handlePortalSearch } = require('./portalSearchHandler');
const { handleDatasetAction } = require('./datasetAction');


exports.OGDHttp = async (req, res) => {
  try {
    const intentName = req.body.intentInfo?.displayName || '';
    console.log("Intent name:", intentName);

    switch (intentName) {
      case 'JsonPortalQuery':
        return await queryDatasetsJson(req, res);

     
      case 'DatasetsSummarize':
      case 'DatasetsVisualize':
      case 'DatasetsDownload':
      case 'DatasetAction':
      case 'DatasetFiletype':
        return await handleDatasetAction(req, res);

      default:
        return await handlePortalSearch(req, res);
    }

  } catch (error) {
    console.error('Webhook Error:', error.message);
    return res.json({
      fulfillment_response: {
        messages: [
          { text: { text: ['An error occurred.'] } },
        ],
      },
    });
  }
};

