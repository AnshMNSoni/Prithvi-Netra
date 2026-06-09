# 🌍 Prithvi Netra: A Smart Urban Planner

Prithvi Netra is a web-based platform that enables users to analyze, visualize, and plan for urban growth using NASA Earth observation data. The platform focuses on identifying urban challenges and supporting data-driven decision-making for sustainable city development.

## ⚡ Recent Updates (June 2026)

- **Dynamic Statistics**: Replaced hardcoded homepage numbers with real-time stats queried directly from database records (monitored cities, community reports, and active scenario simulations).
- **AI Insights & Recommendations**: Integrated a POST route fetching custom location-specific insights from Groq API (fallback to metric-based guidelines when offline).
- **Interactive Simulator Sync**: Configured the *What-If Simulator* to accept external state. Planners can click **Apply Intervention** on any AI recommendation to instantly sync checkboxes and sliders.
- **Scenario Comparison**: Replaced static comparisons with a dynamic tab that computes and compares sandbox simulated outcomes against the city's baseline metrics in real time.
- **Dynamic Policy Insights**: Programmed the Sustainability & Wellbeing index score to compute dynamically from the location's live Air Quality, NDVI, and Water Quality metrics.
- **Animated Trend Graphs**: Embedded 6-month historical AQI and NDVI graphs with entrance animations (powered by `recharts` and `framer-motion`).
- **PDF Report Downloads**: Fixed ESM named export constructor bug in jsPDF, allowing users to print and download full reports successfully.

## 🌐 Features

1️⃣ Urban Issue Analysis: Identify city problems like pollution, lack of greenery, urban heat islands, flood risks, and more.

2️⃣ Data Visualization: Overlay multiple NASA datasets such as temperature, air quality, vegetation (NDVI), land cover, and water quality.

3️⃣ Time-based Insights: Track changes in urban conditions over custom date ranges.

4️⃣ Custom Data Integration: Upload local datasets (CSV, GeoJSON, Shapefile) to combine with satellite data for richer insights.

5️⃣ AI-Powered Queries: Ask intelligent questions like “Which neighborhoods are most affected by heat?” or “Find safe zones for building hospitals.”

6️⃣ Action Planning: Simulate interventions by adding proposed infrastructure (parks, healthcare centers, housing) and estimate impact.

7️⃣ Citizen Feedback: Include crowdsourced inputs from residents to identify problem areas.

## 💻 User Inputs

- City / Location Selection

- Input city name or coordinates, or select location via interactive map.

- Problem Type / Focus Area

- Air Quality, Water Quality, Urban Heat, Green Space Access, Flood Risk, Housing Density, Industrial Growth.

- Time Period / Date Range

- Select a custom range to analyze temporal changes.

- Data Layer Selection

- Toggle datasets: temperature, NDVI, land use, air pollution, water quality.

## 📲 Example User Flow

➡️ User visits the website → sees interactive map dashboard.

➡️ Selects a city or region.

➡️ Sets a date range for analysis.

➡️ Platform fetches NASA Earth observation data.

➡️ Visualizes data via OpenStreetMap's.

➡️ Generates reports and recommendations

## 🛠 Tech Stack

1️⃣ Frontend: React.js, Mapbox or Leaflet.js for interactive maps, Tailwind CSS / Bootstrap

2️⃣ Backend: Node.js for API handling

3️⃣ Data Sources: NASA Earth Observation datasets (temperature, NDVI, air quality, etc.)

4️⃣ LLM: Groq API

5️⃣ Deployment: Render

## 🎯 Goal

Prithvi Netra aims to empower urban planners, local authorities, and citizens with actionable insights to make cities more sustainable, green, and livable using data-driven analysis and NASA satellite imagery.

## 👁️ Preview

1️⃣ Home Page
<img width="1901" height="916" alt="image" src="https://github.com/user-attachments/assets/85258556-778a-4180-bc2c-e98282b0b793" />

2️⃣ Dashboard 
<img width="1896" height="915" alt="image" src="https://github.com/user-attachments/assets/6431e034-d2ce-4483-8112-5787af9fcb79" />

3️⃣ AI Planning Assistant 
<img width="1886" height="913" alt="image" src="https://github.com/user-attachments/assets/a1d28b41-2942-4706-92d4-1dfa927fb978" />

4️⃣ Community Hub
<img width="1894" height="912" alt="image" src="https://github.com/user-attachments/assets/88b6b316-f54c-4496-bcf0-2315eb172cad" />

5️⃣ Policy Insights
<img width="1893" height="912" alt="image" src="https://github.com/user-attachments/assets/2eb65b27-53c8-4ab2-bd05-2e7f71886ee9" />

## 🔮 Future Work

- Real-time Data Integration – Incorporate live satellite feeds and IoT sensor data for up-to-date urban monitoring.

- Predictive Analytics – Use machine learning to forecast urban issues like pollution hotspots or heat islands.

- Advanced Urban Planning Tools – Simulate the impact of new infrastructure, green spaces, or policy changes.

- Community Crowdsourcing – Enable residents to provide geotagged feedback, images, and reports for better city planning.

## 📢 Connect with Me
If you found this project helpful or have any suggestions, feel free to connect:

- [![LinkedIn](https://img.shields.io/badge/LinkedIn-anshmnsoni-0077B5.svg?logo=linkedin)](https://www.linkedin.com/in/anshmnsoni)  
- [![GitHub](https://img.shields.io/badge/GitHub-AnshMNSoni-181717.svg?logo=github)](https://github.com/AnshMNSoni)

## Thankyou 💫 
