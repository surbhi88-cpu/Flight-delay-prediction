import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

def prepare_features(df):
    """Prepare features for training"""
    # Create a copy to avoid modifying original
    df_processed = df.copy()

    # Extract departure hour from scheduled departure time
    df_processed['dep_hour'] = df_processed['sched_dep_time'] // 100

    # Encode origin as numeric
    origin_mapping = {'JFK': 0, 'LGA': 1, 'EWR': 2}
    df_processed['origin_code'] = df_processed['origin'].map(origin_mapping)

    # Select features for model
    features = ['month', 'day', 'dep_hour', 'origin_code', 'distance']
    X = df_processed[features]
    y = df_processed['arr_delay']

    return X, y, features

def train_model():
    """Train the flight delay prediction model"""
    print("Loading data...")

    # Load the dataset
    data_path = '../data/nycflights_sample.csv'
    if not os.path.exists(data_path):
        print(f"Error: Dataset not found at {data_path}")
        return

    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} flight records")

    # Prepare features
    X, y, feature_names = prepare_features(df)

    print(f"Features: {feature_names}")
    print(f"Target: arr_delay")

    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"Training set size: {len(X_train)}")
    print(f"Test set size: {len(X_test)}")

    # Train Random Forest model
    print("\nTraining Random Forest model...")
    rf_model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )

    rf_model.fit(X_train, y_train)

    # Make predictions on test set
    y_pred = rf_model.predict(X_test)

    # Calculate metrics
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    rmse = np.sqrt(mse)

    print("\n" + "="*50)
    print("MODEL PERFORMANCE METRICS")
    print("="*50)
    print(f"R² Score: {r2:.4f}")
    print(f"RMSE: {rmse:.2f} minutes")
    print(f"MSE: {mse:.2f}")

    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_names,
        'importance': rf_model.feature_importances_
    }).sort_values('importance', ascending=False)

    print("\nFeature Importance:")
    for _, row in feature_importance.iterrows():
        print(f"  {row['feature']}: {row['importance']:.4f}")

    # Save the model
    model_path = 'flight_delay_rf.pkl'
    joblib.dump(rf_model, model_path)
    print(f"\nModel saved to: {model_path}")

    # Test prediction example
    print("\nTesting prediction example:")
    sample_input = [[7, 14, 13, 0, 247.0]]  # July 14, 1 PM, JFK, 247 miles
    sample_pred = rf_model.predict(sample_input)
    print(f"Sample input: {dict(zip(feature_names, sample_input[0]))}")
    print(f"Predicted delay: {sample_pred[0]:.1f} minutes")

if __name__ == "__main__":
    train_model()
    
