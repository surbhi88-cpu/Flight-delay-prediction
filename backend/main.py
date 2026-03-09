from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import numpy as np
import os
from typing import List

# Initialize FastAPI app
app = FastAPI(
    title="Flight Delay Prediction API",
    description="Predict arrival delays for flights using machine learning",
    version="1.0.0"
)

# Add CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to store the model
model = None

# Input data model
class FlightInput(BaseModel):
    month: int = Field(..., ge=1, le=12, description="Month (1-12)")
    day: int = Field(..., ge=1, le=31, description="Day of month (1-31)")
    hour: int = Field(..., ge=0, le=23, description="Departure hour (0-23)")
    origin_code: int = Field(..., ge=0, le=2, description="Origin code (JFK=0, LGA=1, EWR=2)")
    distance: float = Field(..., gt=0, description="Flight distance in miles")

# Output data model
class PredictionOutput(BaseModel):
    predicted_delay: float = Field(..., description="Predicted arrival delay in minutes")

@app.on_event("startup")
async def load_model():
    """Load the trained model at startup"""
    global model
    model_path = "flight_delay_rf.pkl"

    if not os.path.exists(model_path):
        raise RuntimeError(f"Model file not found: {model_path}")

    try:
        model = joblib.load(model_path)
        print(f"Model loaded successfully from {model_path}")
    except Exception as e:
        raise RuntimeError(f"Error loading model: {str(e)}")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Flight Delay Prediction API", 
        "status": "active",
        "model_loaded": model is not None
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "endpoints": ["/", "/health", "/predict"]
    }

@app.post("/predict", response_model=PredictionOutput)
async def predict_delay(flight_data: FlightInput):
    """
    Predict flight arrival delay based on input features

    - **month**: Month of the year (1-12)
    - **day**: Day of the month (1-31)  
    - **hour**: Departure hour in 24-hour format (0-23)
    - **origin_code**: Airport code as integer (JFK=0, LGA=1, EWR=2)
    - **distance**: Flight distance in miles
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # Prepare input features in the correct order
        # Features: ['month', 'day', 'dep_hour', 'origin_code', 'distance']
        features = np.array([[
            flight_data.month,
            flight_data.day, 
            flight_data.hour,
            flight_data.origin_code,
            flight_data.distance
        ]])

        # Make prediction
        prediction = model.predict(features)[0]

        # Round to 1 decimal place
        predicted_delay = round(float(prediction), 1)

        return PredictionOutput(predicted_delay=predicted_delay)

    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Prediction error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
