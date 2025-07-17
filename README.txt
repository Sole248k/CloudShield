SETUP INSTRUCTIONS

1. BACKEND
----------
cd backend
pip install -r requirements.txt
Place your trained:
- anomaly_model_ECDF.pkl
- scaler.pkl
Then run:
uvicorn main:app --reload

2. FRONTEND
-----------
cd frontend
npm install
npm run dev

3. Open browser: http://localhost:3000
