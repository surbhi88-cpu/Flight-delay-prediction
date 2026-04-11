# Flight-delay-prediction
This project is about predicting flight delays using machine learning. Flight delays are a common problem that affect passengers, airlines, and airports. By analyzing historical flight data, we can identify patterns and predict whether a flight is likely to be delayed and by how many minutes. 

# Flight Delay Prediction Backend

This is the backend API for the Flight Delay Prediction project using FastAPI and scikit-learn.

## Quick Start

1. **Install Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Start the API Server**
   ```bash
   uvicorn main:app --reload
   ```
   Or alternatively:
   ```bash
   python -m uvicorn main:app --reload
   ```

3. **Open the Frontend**
   - Open `frontend/index.html` in your web browser
   - The frontend will connect to the API running at http://127.0.0.1:8000

## API Documentation

Once the server is running, visit:
- **Interactive API Docs**: http://127.0.0.1:8000/docs
- **Alternative Docs**: http://127.0.0.1:8000/redoc

## API Endpoints

### POST /predict
Predict flight arrival delay.

**Request Body:**
```json
{
    "month": 7,
    "day": 14, 
    "hour": 13,
    "origin_code": 0,
    "distance": 247.0
}
```

**Response:**
```json
{
    "predicted_delay": 12.3
}
```

**Parameters:**
- `month`: Month (1-12)
- `day`: Day of month (1-31)
- `hour`: Departure hour (0-23)
- `origin_code`: Airport (JFK=0, LGA=1, EWR=2)
- `distance`: Distance in miles

## Model Training

To retrain the model with new data:

```bash
python train_model.py
```

This will:
1. Load data from `../data/nycflights_sample.csv`
2. Train a Random Forest model
3. Save the model as `flight_delay_rf.pkl`
4. Print performance metrics

## Model Features

The model uses these input features:
- **month**: Seasonal effects on delays
- **day**: Day of month
- **dep_hour**: Departure hour (derived from scheduled departure time)
- **origin_code**: Airport code (JFK/LGA/EWR encoded as 0/1/2)
- **distance**: Flight distance in miles

Target variable: **arr_delay** (arrival delay in minutes)

## Architecture

- **FastAPI**: Modern Python web framework with automatic API documentation
- **scikit-learn**: Random Forest Regressor for predictions
- **CORS enabled**: Allows frontend requests from any origin (for development)
- **Pydantic**: Input/output validation and serialization
