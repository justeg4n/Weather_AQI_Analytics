import os
import pandas as pd
import numpy as np
import joblib
import logging
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.neighbors import KNeighborsRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots

class WeatherMLModels:
    def __init__(self):
        self.models = {
            'Linear Regression': LinearRegression(),
            'Random Forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'KNN': KNeighborsRegressor(n_neighbors=5),
            'Gradient Boost': GradientBoostingRegressor(n_estimators=100, random_state=42),
            'Decision Tree': DecisionTreeRegressor(random_state=42)
        }
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.trained_model = None
        self.model_name = None
        self.feature_names = None
        self.target_name = None
        self.model_metrics = {}
        
    def prepare_data(self, df, input_features, output_feature):
        """Prepare data for training/prediction"""
        try:
            # Make a copy of the dataframe
            data = df.copy()
            
            # Handle missing values
            data = data.dropna(subset=input_features + [output_feature])
            
            if data.empty:
                raise ValueError("No valid data remaining after removing missing values")
            
            # Prepare features and target
            X = data[input_features].copy()
            y = data[output_feature].copy()
            
            # Handle categorical variables
            categorical_features = X.select_dtypes(include=['object']).columns
            for feature in categorical_features:
                if feature not in self.label_encoders:
                    self.label_encoders[feature] = LabelEncoder()
                    X[feature] = self.label_encoders[feature].fit_transform(X[feature])
                else:
                    # For prediction, use existing encoder
                    try:
                        X[feature] = self.label_encoders[feature].transform(X[feature])
                    except ValueError:
                        # Handle unseen categories
                        X[feature] = X[feature].map(
                            lambda x: 0 if x not in self.label_encoders[feature].classes_ else 
                            self.label_encoders[feature].transform([x])[0]
                        )
            
            # Handle categorical target variable
            if y.dtype == 'object':
                if 'target' not in self.label_encoders:
                    self.label_encoders['target'] = LabelEncoder()
                    y = pd.Series(self.label_encoders['target'].fit_transform(y))
                else:
                    try:
                        y = pd.Series(self.label_encoders['target'].transform(y))
                    except ValueError:
                        # Handle unseen categories in target
                        y = y.map(
                            lambda x: 0 if x not in self.label_encoders['target'].classes_ else 
                            self.label_encoders['target'].transform([x])[0]
                        )
            
            return X, y
            
        except Exception as e:
            logging.error(f"Error preparing data: {str(e)}")
            raise Exception(f"Data preparation failed: {str(e)}")
    
    def train_model(self, dataset_path, model_name, input_features, output_feature, epochs=100):
        """Train a machine learning model"""
        try:
            # Load dataset
            df = pd.read_csv(dataset_path)
            logging.info(f"Loaded dataset with shape: {df.shape}")
            
            # Validate inputs
            if model_name not in self.models:
                raise ValueError(f"Unknown model: {model_name}")
            
            missing_features = set(input_features + [output_feature]) - set(df.columns)
            if missing_features:
                raise ValueError(f"Missing columns in dataset: {missing_features}")
            
            # Prepare data
            X, y = self.prepare_data(df, input_features, output_feature)
            
            if len(X) < 5:
                raise ValueError("Insufficient data for training (need at least 5 samples)")
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train model
            model = self.models[model_name]
            
            # Set epochs for ensemble methods that support it
            if hasattr(model, 'n_estimators') and epochs != 100:
                model.set_params(n_estimators=min(epochs, 1000))
            
            model.fit(X_train_scaled, y_train)
            
            # Make predictions
            y_pred_train = model.predict(X_train_scaled)
            y_pred_test = model.predict(X_test_scaled)
            
            # Calculate metrics
            metrics = {
                'Train RMSE': np.sqrt(mean_squared_error(y_train, y_pred_train)),
                'Test RMSE': np.sqrt(mean_squared_error(y_test, y_pred_test)),
                'Train MAE': mean_absolute_error(y_train, y_pred_train),
                'Test MAE': mean_absolute_error(y_test, y_pred_test),
                'Train R²': r2_score(y_train, y_pred_train),
                'Test R²': r2_score(y_test, y_pred_test),
                'Training Samples': len(X_train),
                'Test Samples': len(X_test)
            }
            
            # Store model info
            self.trained_model = model
            self.model_name = model_name
            self.feature_names = input_features
            self.target_name = output_feature
            self.model_metrics = metrics
            
            # Generate visualizations
            visualizations = self._create_model_visualizations(
                y_train, y_pred_train, y_test, y_pred_test, input_features
            )
            
            # Save model
            model_filename = f"{model_name.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.joblib"
            model_path = os.path.join('trained_model', model_filename)
            
            model_data = {
                'model': model,
                'scaler': self.scaler,
                'label_encoders': self.label_encoders,
                'feature_names': input_features,
                'target_name': output_feature,
                'model_name': model_name,
                'metrics': metrics
            }
            
            joblib.dump(model_data, model_path)
            logging.info(f"Model saved to: {model_path}")
            
            return {
                'success': True,
                'model_name': model_name,
                'metrics': metrics,
                'visualizations': visualizations,
                'model_path': model_path,
                'feature_names': input_features,
                'target_name': output_feature
            }
            
        except Exception as e:
            logging.error(f"Error training model: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def load_pretrained_model(self, dataset_path, model_name, input_features, output_feature):
        """Load or create a pre-trained model"""
        try:
            # Look for existing model file
            model_files = [f for f in os.listdir('trained_model') 
                          if f.startswith(model_name.lower().replace(' ', '_')) and f.endswith('.joblib')]
            
            if model_files:
                # Load most recent model
                model_files.sort(reverse=True)
                model_path = os.path.join('trained_model', model_files[0])
                
                try:
                    model_data = joblib.load(model_path)
                    
                    # Validate model compatibility
                    if (set(model_data['feature_names']) == set(input_features) and 
                        model_data['target_name'] == output_feature):
                        
                        self.trained_model = model_data['model']
                        self.scaler = model_data['scaler']
                        self.label_encoders = model_data['label_encoders']
                        self.model_name = model_data['model_name']
                        self.feature_names = model_data['feature_names']
                        self.target_name = model_data['target_name']
                        self.model_metrics = model_data['metrics']
                        
                        # Create visualizations with current data
                        df = pd.read_csv(dataset_path)
                        X, y = self.prepare_data(df, input_features, output_feature)
                        X_scaled = self.scaler.transform(X)
                        y_pred = self.trained_model.predict(X_scaled)
                        
                        visualizations = self._create_prediction_visualizations(y, y_pred, input_features)
                        
                        return {
                            'success': True,
                            'model_name': model_name,
                            'metrics': self.model_metrics,
                            'visualizations': visualizations,
                            'message': f'Loaded existing model: {model_files[0]}'
                        }
                
                except Exception as load_error:
                    logging.warning(f"Failed to load existing model: {load_error}")
            
            # Train new model if no compatible model found
            logging.info("No compatible pre-trained model found, training new model...")
            return self.train_model(dataset_path, model_name, input_features, output_feature)
            
        except Exception as e:
            logging.error(f"Error loading pre-trained model: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def make_prediction(self, input_data):
        """Make a prediction using the trained model"""
        try:
            if not self.trained_model:
                raise ValueError("No trained model available")
            
            # Convert input data to DataFrame
            df_input = pd.DataFrame([input_data])
            
            # Ensure all required features are present
            missing_features = set(self.feature_names) - set(df_input.columns)
            if missing_features:
                raise ValueError(f"Missing input features: {missing_features}")
            
            # Reorder columns to match training data
            df_input = df_input[self.feature_names]
            
            # Handle categorical variables
            for feature in df_input.columns:
                if feature in self.label_encoders and df_input[feature].dtype == 'object':
                    try:
                        df_input[feature] = self.label_encoders[feature].transform(df_input[feature])
                    except ValueError:
                        # Handle unseen categories
                        df_input[feature] = 0
            
            # Scale features
            X_scaled = self.scaler.transform(df_input)
            
            # Make prediction
            prediction = self.trained_model.predict(X_scaled)[0]
            
            # Decode prediction if target was categorical
            if 'target' in self.label_encoders:
                try:
                    prediction = self.label_encoders['target'].inverse_transform([int(prediction)])[0]
                except (ValueError, IndexError):
                    # If prediction is out of range, return as is
                    pass
            
            return {
                'success': True,
                'prediction': prediction,
                'input_features': input_data,
                'model_name': self.model_name
            }
            
        except Exception as e:
            logging.error(f"Error making prediction: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _create_model_visualizations(self, y_train, y_pred_train, y_test, y_pred_test, feature_names):
        """Create visualizations for model performance"""
        visualizations = []
        
        try:
            # 1. Actual vs Predicted scatter plot
            fig1 = make_subplots(
                rows=1, cols=2,
                subplot_titles=('Training Data', 'Test Data'),
                specs=[[{'type': 'scatter'}, {'type': 'scatter'}]]
            )
            
            # Training data
            fig1.add_trace(
                go.Scatter(
                    x=y_train, y=y_pred_train,
                    mode='markers',
                    name='Training',
                    marker=dict(color='blue', opacity=0.6)
                ),
                row=1, col=1
            )
            
            # Test data
            fig1.add_trace(
                go.Scatter(
                    x=y_test, y=y_pred_test,
                    mode='markers',
                    name='Test',
                    marker=dict(color='red', opacity=0.6)
                ),
                row=1, col=2
            )
            
            # Perfect prediction line
            min_val = min(min(y_train), min(y_test))
            max_val = max(max(y_train), max(y_test))
            
            for col in [1, 2]:
                fig1.add_trace(
                    go.Scatter(
                        x=[min_val, max_val], y=[min_val, max_val],
                        mode='lines',
                        name='Perfect Prediction',
                        line=dict(color='black', dash='dash'),
                        showlegend=(col == 1)
                    ),
                    row=1, col=col
                )
            
            fig1.update_layout(
                title='Actual vs Predicted Values',
                height=400
            )
            fig1.update_xaxes(title_text='Actual')
            fig1.update_yaxes(title_text='Predicted')
            
            visualizations.append({
                'data': fig1.to_dict()['data'],
                'layout': fig1.to_dict()['layout']
            })
            
            # 2. Residuals plot
            residuals_train = y_train - y_pred_train
            residuals_test = y_test - y_pred_test
            
            fig2 = go.Figure()
            fig2.add_trace(
                go.Scatter(
                    x=y_pred_train, y=residuals_train,
                    mode='markers',
                    name='Training Residuals',
                    marker=dict(color='blue', opacity=0.6)
                )
            )
            fig2.add_trace(
                go.Scatter(
                    x=y_pred_test, y=residuals_test,
                    mode='markers',
                    name='Test Residuals',
                    marker=dict(color='red', opacity=0.6)
                )
            )
            
            # Zero line
            fig2.add_hline(y=0, line_dash="dash", line_color="black")
            
            fig2.update_layout(
                title='Residuals Plot',
                xaxis_title='Predicted Values',
                yaxis_title='Residuals',
                height=400
            )
            
            visualizations.append({
                'data': fig2.to_dict()['data'],
                'layout': fig2.to_dict()['layout']
            })
            
            # 3. Feature importance (for tree-based models)
            if hasattr(self.trained_model, 'feature_importances_'):
                importance_df = pd.DataFrame({
                    'feature': feature_names,
                    'importance': self.trained_model.feature_importances_
                }).sort_values('importance', ascending=True)
                
                fig3 = go.Figure(
                    go.Bar(
                        x=importance_df['importance'],
                        y=importance_df['feature'],
                        orientation='h'
                    )
                )
                fig3.update_layout(
                    title='Feature Importance',
                    xaxis_title='Importance',
                    yaxis_title='Features',
                    height=max(300, len(feature_names) * 30)
                )
                
                visualizations.append({
                    'data': fig3.to_dict()['data'],
                    'layout': fig3.to_dict()['layout']
                })
            
        except Exception as e:
            logging.error(f"Error creating visualizations: {str(e)}")
        
        return visualizations
    
    def _create_prediction_visualizations(self, y_actual, y_pred, feature_names):
        """Create visualizations for predictions"""
        visualizations = []
        
        try:
            # Actual vs Predicted
            fig = go.Figure()
            fig.add_trace(
                go.Scatter(
                    x=y_actual, y=y_pred,
                    mode='markers',
                    name='Predictions',
                    marker=dict(color='blue', opacity=0.6)
                )
            )
            
            # Perfect prediction line
            min_val = min(min(y_actual), min(y_pred))
            max_val = max(max(y_actual), max(y_pred))
            
            fig.add_trace(
                go.Scatter(
                    x=[min_val, max_val], y=[min_val, max_val],
                    mode='lines',
                    name='Perfect Prediction',
                    line=dict(color='red', dash='dash')
                )
            )
            
            fig.update_layout(
                title='Model Predictions vs Actual Values',
                xaxis_title='Actual Values',
                yaxis_title='Predicted Values',
                height=400
            )
            
            visualizations.append({
                'data': fig.to_dict()['data'],
                'layout': fig.to_dict()['layout']
            })
            
        except Exception as e:
            logging.error(f"Error creating prediction visualizations: {str(e)}")
        
        return visualizations

# Global instance
ml_models = WeatherMLModels()

def get_available_models():
    """Get list of available ML models"""
    return list(ml_models.models.keys())

def train_model(dataset_path, model_name, input_features, output_feature, epochs=100):
    """Train a machine learning model"""
    return ml_models.train_model(dataset_path, model_name, input_features, output_feature, epochs)

def load_model(dataset_path, model_name, input_features, output_feature):
    """Load or create a pre-trained model"""
    return ml_models.load_pretrained_model(dataset_path, model_name, input_features, output_feature)

def make_prediction(input_data):
    """Make a prediction using the trained model"""
    return ml_models.make_prediction(input_data)

def get_model_info():
    """Get information about the currently loaded model"""
    if ml_models.trained_model:
        return {
            'model_name': ml_models.model_name,
            'feature_names': ml_models.feature_names,
            'target_name': ml_models.target_name,
            'metrics': ml_models.model_metrics
        }
    return None

def export_model(export_path=None):
    """Export the current model"""
    if not ml_models.trained_model:
        raise ValueError("No trained model to export")
    
    if not export_path:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        export_path = f"trained_model/exported_{ml_models.model_name.lower().replace(' ', '_')}_{timestamp}.joblib"
    
    model_data = {
        'model': ml_models.trained_model,
        'scaler': ml_models.scaler,
        'label_encoders': ml_models.label_encoders,
        'feature_names': ml_models.feature_names,
        'target_name': ml_models.target_name,
        'model_name': ml_models.model_name,
        'metrics': ml_models.model_metrics,
        'export_timestamp': datetime.now().isoformat()
    }
    
    joblib.dump(model_data, export_path)
    return export_path
