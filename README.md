# Virtual assistant prototype for European Data Portal

**Prototype for the thesis: _"Interactive Virtual Assistant for Enhancing User Engagement with Open Government Data Portals"_**

This project is a conversational assistant developed to simplify interaction with the European Open Data Portal. It enables users to search, summarise, and visualise datasets using natural language queries. The assistant was developed using **Dialogflow CX**, **Node.js**, and integrated APIs such as the **European Data Portal API** and **OpenAI GPT-3.5**.

---

## Key Features

- **Dataset search** via natural language
- **Metadata summarization** powered by GPT-3.5
- **Visualisation** of numeric datasets using QuickChart
- **Download format suggestions** based on available resources
- **Website assistance** for portal guidance using keyword search
- Fully conversational UI with clickable suggestions

---

## Technological stack

- **Dialogflow CX** – For intent recognition and conversational design
- **Node.js (Express)** – Backend webhook service
- **European Data Portal API** – Dataset search and retrieval
- **OpenAI API (GPT-3.5)** – Natural language metadata explanation
- **Google Custom Search API** – For website search support
- **QuickChart.io** – Visualisation of CSV data
- **Google Cloud Run** – Hosting the backend
- **GitHub Pages** – Hosting the frontend interface

---

## Project Structure

├── csvParser.js
├── dataEuropaJsonHandler.js
├── dataHandler.js
├── datasetAction.js
├── datasetMetadata.js
├── index.html # Frontend entry point
├── index.js
├── indexWebhook.js # Express server entry
├── llmHelper.js # GPT-3.5 integration
├── package.json
├── portalSearchHandler.js
├── responses.js # Rich card formatting
└── README.md


---

## Deployment

The prototype is deployed using **Google Cloud Run** and integrated with **GitHub** for version control. The frontend is available via **GitHub Pages**, and user interactions are routed through Dialogflow CX to the Node.js webhook backend.

---

## Testing

A post-deployment user feedback survey was used to evaluate usability, functionality, and success in retrieving datasets. Results showed that while the UI was easy to use, enhancements in result accuracy and intent handling are planned for future versions.

---

## License

This project was developed as part of a bachelor’s thesis and is intended for academic use only.

---

## Author

**Carl-Christjan Bogoslovski**  
_Tartu University, Institute of Computer Science_  
2025

