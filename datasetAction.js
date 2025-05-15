// datasetAction.js
//const { extractDatasetAction } = require('./llmHelper');

const { buildActionChips } = require('./responses');


exports.handleDatasetAction = async (req, res) => {
  const tag = req.body.fulfillmentInfo?.tag || '';
  const userInput = req.body.text || '';
  const sessionParams = req.body.sessionInfo?.parameters || {};
  const results = sessionParams.results || [];
  const intentName = req.body.intentInfo?.displayName || '';


  if (intentName === 'DatasetSummarize') tag = 'summarize_prompt';
  if (intentName === 'DatasetVisualize') tag = 'visualize_prompt';
  if (intentName === 'DatasetDownload') tag = 'download_prompt';


  console.log("✅ Action (from tag):", tag);

    if (tag === 'summarize_prompt') {
    return res.json({
        fulfillment_response: {
        messages: [
            {
            payload: {
                richContent: buildActionChips('summarize', results)
            }
            }
        ]
        },
        sessionInfo: {
        parameters: {
            dataset_results_ready: false
        }
        }
    });
    }

    if (tag === 'visualize_prompt') {
    return res.json({
        fulfillment_response: {
        messages: [
            {
            payload: {
                richContent: buildActionChips('visualize', results)
            }
            }
        ]
        },
        sessionInfo: {
        parameters: {
            dataset_results_ready: false
        }
        }
    });
    }

    if (tag === 'download_prompt') {
    return res.json({
        fulfillment_response: {
        messages: [
            {
            payload: {
                richContent: buildActionChips('download', results)
            }
            }
        ]
        },
        sessionInfo: {
        parameters: {
            dataset_results_ready: false
        }
        }
    });
    }


  const indexMatch = userInput.match(/\d+/);
  const datasetIndex = indexMatch ? parseInt(indexMatch[0], 10) - 1 : null;
  console.log(datasetIndex);
  

  if (!tag || datasetIndex == null) {
    return res.json({
      fulfillment_response: {
        messages: [{ text: { text: ["❗ Sorry, I couldn't determine the dataset or action you meant."] } }]
      }
    });
  }

  const dataset = results[datasetIndex];
  console.log("✅ Dataset (parsed from input):", dataset.title || "(No title)");

  if (!dataset) {
  return res.json({
    fulfillment_response: {
      messages: [{ text: { text: ["⚠️ No dataset found at that index."] } }]
    }
  });
}





  switch (tag.toLowerCase()) {
    case 'summarize':
      const { explainMetadata } = require('./llmHelper');

      const metadata = {
        title: dataset.title,
        description: dataset.description || '',
        country: dataset.country,
        formats: dataset.formats || [],
        csvLinks: dataset.csvLinks || [],
        license: dataset.license || '',
        publisher: dataset.publisher || ''
      };


      const explanation = await explainMetadata(metadata);

      return res.json({
        fulfillment_response: {
          messages: [
            { text: { text: [`📘 Metadata summarization for **${dataset.title}**:\n${explanation}`] } }
          ]
        }
      });



  case 'visualize': {
    const { parseCsvFromUrl } = require('./csvParser');
    const csvUrl = (dataset.formatLinks?.["csv"] && dataset.formatLinks["csv"][0]) || dataset.csvLinks?.[0];

    if (!csvUrl) {
      return res.json({
        fulfillment_response: {
          messages: [{ text: { text: ["⚠️ This dataset has no CSV file available to visualize."] } }]
        }
      });
    }

    const rows = await parseCsvFromUrl(csvUrl);
    if (!rows || rows.length === 0) {
      return res.json({
        fulfillment_response: {
          messages: [{ text: { text: ["⚠️ Failed to read any data from the dataset."] } }]
        }
      });
    }

    const keys = Object.keys(rows[0]).filter(key => {
      return !isNaN(parseFloat(rows[0][key]));
    }).slice(0, 3);

    

    const labelKey = Object.keys(rows[0]).find(key => {
      const uniqueValues = [...new Set(rows.map(row => row[key]))];
      return uniqueValues.length > 3 && typeof rows[0][key] === 'string' && uniqueValues.every(v => v && v.length > 1);
    }) || null;

    const chartLabels = labelKey
      ? rows.slice(0, 10).map(row => row[labelKey])
      : rows.slice(0, 10).map((_, index) => `Row ${index + 1}`);

    const numericKeys = Object.keys(rows[0]).filter(key => {
      const values = rows.map(row => parseFloat(row[key])).filter(v => !isNaN(v));
      const uniqueValues = [...new Set(values)];
      return uniqueValues.length > 1 && uniqueValues.length < values.length; 
    }).slice(0, 3);


    if (numericKeys.length === 0) {
      return res.json({
        fulfillment_response: {
          messages: [{ text: { text: ["⚠️ No meaningful numeric data found to visualize."] } }]
        }
      });
    }

  const chartDatasets = numericKeys.map(key => ({
    label: key,
    data: rows.slice(0, 10).map(row => parseFloat(row[key]) || 0)
  }));

  const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify({
    type: "line",
    data: {
      labels: chartLabels,
      datasets: chartDatasets
    },
    options: {
      title: {
        display: true,
        text: "Visualization of " + dataset.title,
      },
      legend: {
        display: true,
        position: "bottom"
      }
    }
  }))}`;


    return res.json({
      fulfillment_response: {
        messages: [
          { text: { text: [`🔗 [Chart for **${dataset.title}**](${chartUrl})`] } }
        ]
      }
    });

  }




  case 'download':
    const availableFormats = Object.keys(dataset.formatLinks || {});

    if (availableFormats.length > 1) {
      return res.json({
        fulfillment_response: {
          messages: [{
            payload: {
              richContent: [
                [
                  {
                    type: "chips",
                    title: `Which format would you like to download **${dataset.title}** in?`,
                    options: availableFormats.map(format => ({
                      text: `Download dataset ${datasetIndex + 1} as ${format.toUpperCase()}`
                    }))
                  }
                ]
              ]
            }
          }]
        },
        sessionInfo: {
                parameters: {
                  dataset_results_ready: false,
                }
              }
      });
    } else {
        const fallbackLink = dataset.csvLinks?.[0] || dataset.link;
        return res.json({
          fulfillment_response: {
            messages: [{
              text: {
                text: [`📥 Download dataset **${dataset.title}** here:\n${fallbackLink}`]
              }
            }]
          }, 
          sessionInfo: {
                parameters: {
                  dataset_results_ready: true,
                }
              }
        });
    }

    case 'filetype': {
      const formatMatch = userInput.match(/as (.+)$/i);
        
      if (!formatMatch || !formatMatch[1]) {
        return res.json({
          fulfillment_response: {
            messages: [{ text: { text: ["⚠️ Sorry, I couldn't understand which format you want."] } }]
          }
        });
      }

      const selectedFormat = formatMatch[1].toLowerCase(); // "csv", "json"


      const downloadLinks = dataset.formatLinks?.[selectedFormat];

      if (downloadLinks && downloadLinks.length > 0) {
        return res.json({
          fulfillment_response: {
            messages: [{
              text: {
                text: [`📥 Here is your **${dataset.title}** in **${selectedFormat.toUpperCase()}** format:\n${downloadLinks[0]}`]
              }
            }]
          }
        });
      } else {
        return res.json({
          fulfillment_response: {
            messages: [{
              text: {
                text: [`❌ Sorry, the format **${selectedFormat.toUpperCase()}** is not available for this dataset.`]
              }
            }]
          }
        });
      }
  }


  default:
    return res.json({
      fulfillment_response: {
        messages: [{ text: { text: ["Action not supported. Try 'summarize', 'visualize' or 'download'."] } }]
      }
    });
}
};
