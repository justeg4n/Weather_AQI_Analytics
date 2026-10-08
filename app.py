import os
import logging
from flask import Flask, render_template, request, jsonify, flash, redirect, url_for, session, send_from_directory
from werkzeug.utils import secure_filename
import pandas as pd
import json
from dotenv import load_dotenv
from utils.weather_api import get_current_weather, update_api_credentials
from utils.data_analysis import analyze_dataset, generate_visualizations
from utils.ml_models import train_model, load_model, make_prediction, get_available_models
import joblib
from datetime import datetime
from ibm_watson import AssistantV2
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from ibm_cloud_sdk_core import ApiException

# Load environment variables
load_dotenv()
print("Environment variables loaded from .env file")

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__, static_folder='build', static_url_path='')
app.secret_key = os.environ.get("SESSION_SECRET", "your-secret-key-here")

# Initialize IBM Watson Assistant (conditionally)
assistant = None
session_holder = []  # Store session_id in memory

try:
    assistant_apikey = os.getenv('WATSONX_API_KEY')
    assistant_url = os.getenv('WATSONX_SERVICE_URL')
    environment_id = os.getenv('WATSONX_ENVIRONMENT_ID')

    if assistant_apikey and assistant_url and environment_id:
        assistant_auth = IAMAuthenticator(assistant_apikey)
        assistant = AssistantV2(version='2024-08-25', authenticator=assistant_auth)
        assistant.set_service_url(assistant_url)
        logging.info("Watson Assistant initialized successfully")
    else:
        missing_vars = []
        if not assistant_apikey:
            missing_vars.append('WATSONX_API_KEY')
        if not assistant_url:
            missing_vars.append('WATSONX_SERVICE_URL')
        if not environment_id:
            missing_vars.append('WATSONX_ENVIRONMENT_ID')
        logging.warning(f"Watson Assistant credentials incomplete. Missing: {', '.join(missing_vars)}")
        assistant = None
except Exception as e:
    logging.error(f"Failed to initialize Watson Assistant: {e}")
    assistant = None

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs('trained_model', exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def home():
    """Serve React frontend"""
    # Check if we're in development mode and local_index.html exists
    if app.debug and os.path.exists('local_index.html'):
        logging.info("Serving local development version")
        return send_from_directory('.', 'local_index.html')

    # Fallback to build version
    if os.path.exists('build/index.html'):
        return send_from_directory('build', 'index.html')
    else:
        # If no build exists, serve local version as fallback
        if os.path.exists('local_index.html'):
            return send_from_directory('.', 'local_index.html')
        else:
            return jsonify({
                'error': 'Frontend not found',
                'message': 'Please build the React frontend or ensure local_index.html exists'
            }), 404

@app.route('/notebook')
def notebook():
    """Serve the Jupyter notebook HTML"""
    return send_from_directory('static', 'notebook.html')

# Catch all route for React Router
@app.route('/<path:path>')
def catch_all(path):
    """Serve React app for client-side routing"""
    if path.startswith('api/'):
        return jsonify({'error': 'API endpoint not found'}), 404

    # Serve the same HTML file as the home route
    if app.debug and os.path.exists('local_index.html'):
        return send_from_directory('.', 'local_index.html')

    if os.path.exists('build/index.html'):
        return send_from_directory('build', 'index.html')
    else:
        if os.path.exists('local_index.html'):
            return send_from_directory('.', 'local_index.html')
        else:
            return jsonify({'error': 'Frontend not found'}), 404

@app.route('/api/weather/current')
def api_current_weather():
    """API endpoint for current weather data"""
    try:
        weather_data = get_current_weather("Ho Chi Minh City")
        return jsonify(weather_data)
    except Exception as e:
        logging.error(f"Error fetching weather data: {str(e)}")
        return jsonify({'error': f'Error fetching weather data: {str(e)}'}), 500

@app.route('/upload-dataset', methods=['POST'])
def upload_dataset():
    """Handle dataset upload and analysis"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file selected'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(str(file.filename))
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)

            # Store the uploaded file path in session
            session['uploaded_dataset'] = filepath

            # Analyze the dataset
            analysis_result = analyze_dataset(filepath)
            
            # Get dataset columns for feature selection
            import pandas as pd
            df = pd.read_csv(filepath)
            columns = df.columns.tolist()

            return jsonify({
                'success': True,
                'analysis': analysis_result,
                'filename': filename,
                'columns': columns
            })
        else:
            return jsonify({'error': 'Invalid file type. Please upload a CSV file.'}), 400

    except Exception as e:
        logging.error(f"Error uploading dataset: {str(e)}")
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500

@app.route('/analyze-default-dataset')
def analyze_default_dataset():
    """Analyze the default HCM weather dataset"""
    try:
        default_dataset = 'HCM_WEATHER_DEFAULT.csv'
        if not os.path.exists(default_dataset):
            return jsonify({'error': 'Default dataset not found'}), 404

        # Store the default dataset path in session
        session['uploaded_dataset'] = default_dataset

        analysis_result = analyze_dataset(default_dataset)
        return jsonify({
            'success': True,
            'analysis': analysis_result,
            'filename': 'HCM_WEATHER_DEFAULT.csv'
        })

    except Exception as e:
        logging.error(f"Error analyzing default dataset: {str(e)}")
        return jsonify({'error': f'Error analyzing dataset: {str(e)}'}), 500

@app.route('/weather-forecast')
def weather_forecast():
    """Weather forecast page with ML models"""
    available_models = get_available_models()
    return render_template('weather_forecast.html', available_models=available_models)

@app.route('/get-dataset-columns')
def get_dataset_columns():
    """Get columns from the current dataset"""
    try:
        dataset_path = session.get('uploaded_dataset')
        if not dataset_path or not os.path.exists(dataset_path):
            return jsonify({'error': 'No dataset available. Please upload a dataset first.'}), 400

        df = pd.read_csv(dataset_path)
        columns = df.columns.tolist()
        return jsonify({'columns': columns})

    except Exception as e:
        logging.error(f"Error getting dataset columns: {str(e)}")
        return jsonify({'error': f'Error reading dataset: {str(e)}'}), 500

@app.route('/train-model', methods=['POST'])
def train_model_route():
    """Train a new ML model"""
    try:
        data = request.get_json()
        dataset_path = session.get('uploaded_dataset')

        if not dataset_path or not os.path.exists(dataset_path):
            return jsonify({'error': 'No dataset available. Please upload a dataset first.'}), 400

        model_name = data.get('model_name')
        input_features = data.get('input_features', [])
        output_feature = data.get('output_feature')
        epochs = data.get('epochs', 100)

        if not all([model_name, input_features, output_feature]):
            return jsonify({'error': 'Missing required parameters'}), 400

        # Train the model
        result = train_model(dataset_path, model_name, input_features, output_feature, epochs)

        return jsonify(result)

    except Exception as e:
        logging.error(f"Error training model: {str(e)}")
        return jsonify({'error': f'Error training model: {str(e)}'}), 500

@app.route('/use-pretrained-model', methods=['POST'])
def use_pretrained_model():
    """Use a pre-trained model for prediction"""
    try:
        data = request.get_json()
        model_name = data.get('model_name')
        input_features = data.get('input_features', [])
        output_feature = data.get('output_feature')

        dataset_path = session.get('uploaded_dataset', 'HCM_WEATHER_DEFAULT.csv')

        if not os.path.exists(dataset_path):
            return jsonify({'error': 'Dataset not found'}), 400

        # Load or train the model
        result = load_model(dataset_path, model_name, input_features, output_feature)

        return jsonify(result)

    except Exception as e:
        logging.error(f"Error using pre-trained model: {str(e)}")
        return jsonify({'error': f'Error using model: {str(e)}'}), 500

@app.route('/make-prediction', methods=['POST'])
def make_prediction_route():
    """Make a prediction using the trained model"""
    try:
        data = request.get_json()
        input_data = data.get('input_data', {})

        if not input_data:
            return jsonify({'error': 'No input data provided'}), 400

        # Make prediction
        result = make_prediction(input_data)

        return jsonify(result)

    except Exception as e:
        logging.error(f"Error making prediction: {str(e)}")
        return jsonify({'error': f'Error making prediction: {str(e)}'}), 500

@app.route('/api-settings')
def api_settings():
    """API settings page"""
    return render_template('api_settings.html')

@app.route('/update-api-settings', methods=['POST'])
def update_api_settings():
    """Update API settings"""
    try:
        data = request.get_json()

        # Update environment variables
        update_api_credentials(data)

        flash('API settings updated successfully!', 'success')
        return jsonify({'success': True, 'message': 'API settings updated successfully!'})

    except Exception as e:
        logging.error(f"Error updating API settings: {str(e)}")
        return jsonify({'error': f'Error updating settings: {str(e)}'}), 500

@app.route('/api/message', methods=['POST'])
def assistant_message():
    """Handle Watson Assistant messages"""
    try:
        if not assistant:
            return jsonify({'error': 'Watson Assistant not initialized.'}), 500

        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing text in request'}), 400

        text = data['text'].strip()

        # Try to get session ID from the list
        session_id = session_holder[0] if session_holder else None

        def send_message_with_session(session_id):
            environment_id = os.getenv("WATSONX_ENVIRONMENT_ID")
            return assistant.message(
                assistant_id=environment_id,
                environment_id=environment_id,
                session_id=session_id,
                input={"message_type": "text", "text": text}
            ).get_result()

        try:
            # Try with existing session
            if session_id:
                response = send_message_with_session(session_id)
            else:
                raise KeyError

        except (ApiException, KeyError) as e:
            # If session invalid or missing, create new and retry
            if isinstance(e, ApiException) and e.code != 404:
                raise  # Only retry on expired session

            # Create new session
            environment_id = os.getenv("WATSONX_ENVIRONMENT_ID")
            new_session_id = assistant.create_session(assistant_id=environment_id).get_result()["session_id"]

            # Store it (overwrite the list)
            session_holder.clear()
            session_holder.append(new_session_id)

            # Retry message
            response = send_message_with_session(new_session_id)

        return jsonify(response["output"]["generic"])

    except Exception as e:
        logging.error(f"Error in assistant_message: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/chatbot-config')
def chatbot_config():
    """Get chatbot configuration"""
    # Use the same environment variables as the Watson Assistant initialization
    assistant_apikey = os.getenv('WATSONX_API_KEY', '')
    assistant_url = os.getenv('WATSONX_SERVICE_URL', '')
    environment_id = os.getenv('WATSONX_ENVIRONMENT_ID', '')

    # Check if all required credentials are present
    has_credentials = bool(assistant_apikey) and bool(assistant_url) and bool(environment_id)
    is_initialized = assistant is not None and has_credentials

    config = {
        'assistant_id': environment_id,
        'service_url': assistant_url,
        'api_key': assistant_apikey,
        'environment_id': environment_id,
        'initialized': is_initialized,
        'configured': has_credentials,
        'status': 'ready' if is_initialized else 'not_configured',
        'message': 'Watson Assistant is ready' if is_initialized else 'Watson Assistant not configured'
    }

    logging.info(f"Chatbot config requested - initialized: {is_initialized}, configured: {has_credentials}")

    # Add CORS headers for local development
    response = jsonify(config)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

@app.route('/api/debug/env')
def debug_env():
    """Debug endpoint to check environment variables (for development only)"""
    if not app.debug:
        return jsonify({'error': 'Debug endpoint only available in development mode'}), 403

    return jsonify({
        'WATSONX_API_KEY': 'SET' if os.getenv('WATSONX_API_KEY') else 'NOT SET',
        'WATSONX_SERVICE_URL': 'SET' if os.getenv('WATSONX_SERVICE_URL') else 'NOT SET', 
        'WATSONX_ENVIRONMENT_ID': 'SET' if os.getenv('WATSONX_ENVIRONMENT_ID') else 'NOT SET',
        'assistant_initialized': assistant is not None,
        'debug_mode': app.debug
    })

@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
