import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Brain, Play, Settings as SettingsIcon, Download } from 'lucide-react';
import { MLModelResult } from '../../types/weather';
import axios from 'axios';

const ForecastTab: React.FC = () => {
  const [modelType, setModelType] = useState<'pretrained' | 'training' | null>(null);
  const [availableModels] = useState(['Linear Regression', 'Random Forest', 'KNN', 'Gradient Boost', 'Decision Tree']);
  const [selectedModel, setSelectedModel] = useState('');
  const [columns, setColumns] = useState<string[]>([]);
  const [inputFeatures, setInputFeatures] = useState<string[]>([]);
  const [outputFeature, setOutputFeature] = useState('');
  const [epochs, setEpochs] = useState(100);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MLModelResult | null>(null);
  const [predictionData, setPredictionData] = useState<Record<string, string>>({});
  const [showInputDropdown, setShowInputDropdown] = useState(false);
  const [showOutputDropdown, setShowOutputDropdown] = useState(false);
  const [inputSearchTerm, setInputSearchTerm] = useState('');
  const [outputSearchTerm, setOutputSearchTerm] = useState('');

  useEffect(() => {
    loadColumns();
  }, []);

  // Helper functions for dropdown functionality
  const getAvailableInputFeatures = () => {
    if (!columns.length) return [];
    return columns.filter(col => 
      !inputFeatures.includes(col) && 
      col !== outputFeature &&
      col.toLowerCase().includes(inputSearchTerm.toLowerCase())
    );
  };

  const getAvailableOutputFeatures = () => {
    if (!columns.length) return [];
    return columns.filter(col => 
      !inputFeatures.includes(col) &&
      col.toLowerCase().includes(outputSearchTerm.toLowerCase())
    );
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.dropdown-container')) {
        setShowInputDropdown(false);
        setShowOutputDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadColumns = async () => {
    try {
      const response = await axios.get('/get-dataset-columns');
      setColumns(response.data.columns || []);
    } catch (error) {
      console.error('Error loading columns:', error);
    }
  };

  const handleModelRun = async () => {
    if (!selectedModel || !inputFeatures.length || !outputFeature) {
      alert('Please select model, input features, and output feature');
      return;
    }

    try {
      setLoading(true);
      const endpoint = modelType === 'pretrained' ? '/use-pretrained-model' : '/train-model';
      const payload = {
        model_name: selectedModel,
        input_features: inputFeatures,
        output_feature: outputFeature,
        ...(modelType === 'training' && { epochs })
      };

      const response = await axios.post(endpoint, payload);
      setResult(response.data);
      
      // Initialize prediction data with empty values for each input feature
      const initialPredictionData: Record<string, string> = {};
      inputFeatures.forEach(feature => {
        initialPredictionData[feature] = '';
      });
      setPredictionData(initialPredictionData);
    } catch (error) {
      console.error('Error running model:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrediction = async () => {
    if (!result || Object.values(predictionData).some(val => val === '')) {
      alert('Please fill in all input values');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/make-prediction', {
        input_data: predictionData
      });
      
      if (response.data.success) {
        alert(`Prediction: ${response.data.prediction}`);
      } else {
        alert(`Error: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error making prediction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8" style={{ overflow: 'visible' }}>
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-white">Weather Forecasting</h2>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Use machine learning models to predict weather conditions with high accuracy
        </p>
      </div>

      {/* Model Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card 
          className={`border-2 cursor-pointer transition-all ${
            modelType === 'pretrained' 
              ? 'border-green-500 bg-slate-800/80' 
              : 'border-slate-600 hover:border-green-400 bg-slate-800/50'
          }`}
          onClick={() => setModelType('pretrained')}
          style={{ overflow: 'visible' }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Download className="w-6 h-6 text-green-600" />
              Use Pre-trained Model
            </CardTitle>
            <CardDescription>
              Quick predictions using our pre-trained models
            </CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className={`border-2 cursor-pointer transition-all ${
            modelType === 'training' 
              ? 'border-purple-500 bg-slate-800/80' 
              : 'border-slate-600 hover:border-purple-400 bg-slate-800/50'
          }`}
          onClick={() => setModelType('training')}
          style={{ overflow: 'visible' }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-purple-600" />
              Train New Model
            </CardTitle>
            <CardDescription>
              Train a custom model with your specific parameters
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Model Configuration */}
      {modelType && (
        <Card className="bg-slate-800/50 border-slate-600" style={{ overflow: 'visible' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <SettingsIcon className="w-6 h-6" />
              {modelType === 'pretrained' ? 'Pre-trained' : 'Training'} Model Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6" style={{ overflow: 'visible' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Model</label>
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a model...</option>
                  {availableModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              {/* Input Features */}
              <div className="relative dropdown-container" style={{ overflow: 'visible' }}>
                <label className="block text-sm font-medium mb-2 text-white">Input Features</label>
                <div className="relative">
                  <div
                    className="min-h-[48px] p-3 bg-slate-700 border border-slate-600 rounded-lg cursor-text flex flex-wrap gap-2 items-center"
                    onClick={() => setShowInputDropdown(!showInputDropdown)}
                  >
                    {inputFeatures.map(feature => (
                      <span
                        key={feature}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-sm flex items-center gap-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInputFeatures(inputFeatures.filter(f => f !== feature));
                        }}
                      >
                        {feature}
                      </span>
                    ))}
                    <input
                      type="text"
                      value={inputSearchTerm}
                      onChange={(e) => {
                        setInputSearchTerm(e.target.value);
                        setShowInputDropdown(true);
                      }}
                      onFocus={() => setShowInputDropdown(true)}
                      placeholder={inputFeatures.length === 0 ? "Type to search input features..." : ""}
                      className="bg-transparent border-none outline-none text-white placeholder-gray-400 flex-1 min-w-0"
                    />
                  </div>
                  
                  {showInputDropdown && (
                    <div 
                      className="absolute top-full left-0 right-0 bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1"
                      style={{ zIndex: 999999 }}
                    >
                      {getAvailableInputFeatures().map(feature => (
                        <div
                          key={feature}
                          className="p-3 hover:bg-slate-600 cursor-pointer text-white"
                          onClick={() => {
                            if (!inputFeatures.includes(feature)) {
                              setInputFeatures([...inputFeatures, feature]);
                            }
                            setInputSearchTerm('');
                            setShowInputDropdown(false);
                          }}
                        >
                          {feature}
                        </div>
                      ))}
                      {getAvailableInputFeatures().length === 0 && (
                        <div className="p-3 text-gray-400">No available features</div>
                      )}
                    </div>
                  )}
                </div>
              </div>



              {/* Epochs (for training only) */}
              {modelType === 'training' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Epochs: {epochs}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    value={epochs}
                    onChange={(e) => setEpochs(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <Button 
              onClick={handleModelRun}
              disabled={loading || !selectedModel || !inputFeatures.length || !outputFeature}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {loading ? 'Processing...' : `${modelType === 'pretrained' ? 'Run Prediction' : 'Start Training'}`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Model Results */}
      {result && result.success && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-800">Model Results</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Model Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Model Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.metrics && Object.entries(result.metrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">{key}</span>
                      <span className="font-bold text-gray-900">
                        {typeof value === 'number' ? value.toFixed(4) : value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Make Prediction */}
            <Card>
              <CardHeader>
                <CardTitle>Make Prediction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {inputFeatures.map(feature => (
                  <div key={feature}>
                    <label className="block text-sm font-medium mb-1">{feature}</label>
                    <input
                      type="number"
                      step="any"
                      value={predictionData[feature] || ''}
                      onChange={(e) => setPredictionData(prev => ({
                        ...prev,
                        [feature]: e.target.value
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Enter ${feature} value`}
                    />
                  </div>
                ))}
                <Button 
                  onClick={handlePrediction}
                  disabled={loading || Object.values(predictionData).some(val => val === '')}
                  className="w-full"
                >
                  {loading ? 'Predicting...' : 'Make Prediction'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {result && !result.success && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-red-500">⚠️</span>
              <div>
                <p className="text-red-800 font-medium">Model Error</p>
                <p className="text-red-600 text-sm">{result.error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ForecastTab;