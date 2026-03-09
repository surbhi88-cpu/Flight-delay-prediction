// DOM elements
const form = document.getElementById('predictionForm');
const predictBtn = document.getElementById('predictBtn');
const resultDiv = document.getElementById('result');
const errorDiv = document.getElementById('error');
const delayValue = document.getElementById('delayValue');
const resultMessage = document.getElementById('resultMessage');
const errorMessage = document.getElementById('errorMessage');
const spinner = document.getElementById('spinner');

// API configuration
const API_BASE_URL = 'http://127.0.0.1:8000';

// Form submission handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await predictDelay();
});

// Main prediction function
async function predictDelay() {
    // Hide previous results
    hideResults();

    // Show loading state
    setLoadingState(true);

    try {
        // Get form data
        const formData = getFormData();

        // Validate form data
        if (!validateFormData(formData)) {
            throw new Error('Please fill in all fields correctly');
        }

        // Make API request
        const prediction = await callPredictionAPI(formData);

        // Show results
        showResult(prediction.predicted_delay);

    } catch (error) {
        console.error('Prediction error:', error);
        showError(error.message);
    } finally {
        setLoadingState(false);
    }
}

// Get form data
function getFormData() {
    return {
        month: parseInt(document.getElementById('month').value),
        day: parseInt(document.getElementById('day').value),
        hour: parseInt(document.getElementById('hour').value),
        origin_code: parseInt(document.getElementById('origin').value),
        distance: parseFloat(document.getElementById('distance').value)
    };
}

// Validate form data
function validateFormData(data) {
    // Check for required fields
    if (isNaN(data.month) || isNaN(data.day) || isNaN(data.hour) || 
        isNaN(data.origin_code) || isNaN(data.distance)) {
        return false;
    }

    // Validate ranges
    if (data.month < 1 || data.month > 12) return false;
    if (data.day < 1 || data.day > 31) return false;
    if (data.hour < 0 || data.hour > 23) return false;
    if (data.origin_code < 0 || data.origin_code > 2) return false;
    if (data.distance <= 0 || data.distance > 5000) return false;

    return true;
}

// Call the prediction API
async function callPredictionAPI(data) {
    const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        // Handle different error types
        if (response.status === 422) {
            const errorData = await response.json();
            throw new Error('Invalid input data. Please check your values.');
        } else if (response.status === 503) {
            throw new Error('Prediction service is currently unavailable. Please try again later.');
        } else if (response.status >= 500) {
            throw new Error('Server error occurred. Please try again later.');
        } else {
            throw new Error('Network error. Please check your connection and try again.');
        }
    }

    const result = await response.json();
    return result;
}

// Show loading state
function setLoadingState(isLoading) {
    predictBtn.disabled = isLoading;
    predictBtn.classList.toggle('loading', isLoading);

    if (isLoading) {
        predictBtn.querySelector('.btn-text').textContent = 'Predicting...';
    } else {
        predictBtn.querySelector('.btn-text').textContent = 'Predict Delay';
    }
}

// Hide all result/error divs
function hideResults() {
    resultDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    resultDiv.classList.remove('show');
    errorDiv.classList.remove('show');
}

// Show prediction result
function showResult(delay) {
    delayValue.textContent = delay.toFixed(1);

    // Generate appropriate message based on delay
    let message = '';
    if (delay < 0) {
        message = `Great news! Your flight is predicted to arrive ${Math.abs(delay).toFixed(1)} minutes early.`;
        delayValue.style.color = '#48bb78';
    } else if (delay === 0) {
        message = 'Your flight is predicted to arrive on time.';
        delayValue.style.color = '#38b2ac';
    } else if (delay <= 15) {
        message = 'Your flight has a minor predicted delay. This is quite common and manageable.';
        delayValue.style.color = '#ed8936';
    } else if (delay <= 30) {
        message = 'Your flight has a moderate predicted delay. Consider adjusting your plans accordingly.';
        delayValue.style.color = '#f56565';
    } else {
        message = 'Your flight has a significant predicted delay. You may want to consider alternative arrangements.';
        delayValue.style.color = '#e53e3e';
    }

    resultMessage.textContent = message;

    // Show result with animation
    resultDiv.classList.remove('hidden');
    setTimeout(() => {
        resultDiv.classList.add('show');
    }, 10);
}

// Show error message
function showError(message) {
    errorMessage.textContent = message || 'An unexpected error occurred. Please try again.';

    // Show error with animation
    errorDiv.classList.remove('hidden');
    setTimeout(() => {
        errorDiv.classList.add('show');
    }, 10);
}

// Input validation and UX improvements
document.addEventListener('DOMContentLoaded', function() {
    // Add input event listeners for real-time validation
    const inputs = form.querySelectorAll('input, select');

    inputs.forEach(input => {
        input.addEventListener('input', function() {
            // Clear previous results when user changes input
            if (!resultDiv.classList.contains('hidden') || !errorDiv.classList.contains('hidden')) {
                hideResults();
            }
        });

        // Add blur validation for numeric inputs
        if (input.type === 'number') {
            input.addEventListener('blur', function() {
                validateNumericInput(input);
            });
        }
    });

    // Set default values for demonstration
    setDefaultValues();
});

// Validate individual numeric input
function validateNumericInput(input) {
    const value = parseFloat(input.value);
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);

    if (input.value && (isNaN(value) || value < min || value > max)) {
        input.style.borderColor = '#fc8181';
        input.title = `Please enter a value between ${min} and ${max}`;
    } else {
        input.style.borderColor = '';
        input.title = '';
    }
}

// Set some default values for easy testing
function setDefaultValues() {
    // Set a reasonable default example
    document.getElementById('month').value = '7'; // July
    document.getElementById('day').value = '14';
    document.getElementById('hour').value = '13'; // 1 PM
    document.getElementById('origin').value = '0'; // JFK
    document.getElementById('distance').value = '247.5';
}

// Helper function to get origin name
function getOriginName(originCode) {
    const origins = {
        0: 'JFK',
        1: 'LGA', 
        2: 'EWR'
    };
    return origins[originCode] || 'Unknown';
}

// Add keyboard shortcut for quick prediction (Enter key)
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !predictBtn.disabled) {
        e.preventDefault();
        predictDelay();
    }
});

// Error handling for API connection issues
window.addEventListener('online', function() {
    if (document.querySelector('.error:not(.hidden)')) {
        // If there was a network error, clear it when connection is restored
        hideResults();
    }
});

window.addEventListener('offline', function() {
    showError('You appear to be offline. Please check your internet connection.');
});