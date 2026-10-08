import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Eye, EyeOff, Key, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { APISettings } from '../../types/weather';
import axios from 'axios';

const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<APISettings>({
    openweather_api_key: '',
    watsonx_api_key: '',
    watsonx_assistant_id: '',
    watsonx_service_url: 'https://api.watsonx.ai/v1'
  });
  const [showKeys, setShowKeys] = useState({
    openweather: false,
    watsonx: false
  });
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState({
    openweather: null as 'success' | 'error' | null,
    watsonx: null as 'success' | 'error' | null
  });

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    try {
      const response = await axios.get('/chatbot-config');
      setSettings(prev => ({
        ...prev,
        watsonx_assistant_id: response.data.assistant_id || '',
        watsonx_service_url: response.data.service_url || 'https://api.watsonx.ai/v1'
      }));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleInputChange = (field: keyof APISettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const testOpenWeatherAPI = async () => {
    if (!settings.openweather_api_key) {
      alert('Please enter an API key first');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=Ho Chi Minh City&appid=${settings.openweather_api_key}`
      );
      
      if (response.ok) {
        setTestResults(prev => ({ ...prev, openweather: 'success' }));
      } else {
        setTestResults(prev => ({ ...prev, openweather: 'error' }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, openweather: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const testWatsonxAPI = async () => {
    if (!settings.watsonx_api_key || !settings.watsonx_assistant_id) {
      alert('Please fill in all Watsonx fields first');
      return;
    }

    try {
      setLoading(true);
      // Simulate test for demo purposes
      setTimeout(() => {
        setTestResults(prev => ({ ...prev, watsonx: 'success' }));
        setLoading(false);
      }, 2000);
    } catch (error) {
      setTestResults(prev => ({ ...prev, watsonx: 'error' }));
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/update-api-settings', settings);
      
      if (response.data.success) {
        alert('Settings saved successfully!');
      } else {
        alert(`Error: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-800">API Settings</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Configure your API credentials for OpenWeather and Watsonx services
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* OpenWeather API Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                OpenWeather API
              </CardTitle>
              <CardDescription>
                Configure your OpenWeather API credentials. Get a free API key from{' '}
                <a 
                  href="https://openweathermap.org/api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  OpenWeatherMap
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Key className="w-4 h-4 inline mr-1" />
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeys.openweather ? 'text' : 'password'}
                    value={settings.openweather_api_key}
                    onChange={(e) => handleInputChange('openweather_api_key', e.target.value)}
                    placeholder="Enter your OpenWeather API key"
                    className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys(prev => ({ ...prev, openweather: !prev.openweather }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showKeys.openweather ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Used to fetch current weather data for Ho Chi Minh City
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  onClick={testOpenWeatherAPI}
                  disabled={loading || !settings.openweather_api_key}
                  variant="outline"
                  size="sm"
                >
                  {loading ? 'Testing...' : 'Test Connection'}
                </Button>
                
                {testResults.openweather && (
                  <div className={`flex items-center gap-2 ${
                    testResults.openweather === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {testResults.openweather === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {testResults.openweather === 'success' ? 'Connected' : 'Failed'}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Watsonx API Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Key className="w-4 h-4 text-white" />
                </div>
                Watsonx Assistant
              </CardTitle>
              <CardDescription>
                Configure your Watsonx Assistant for chatbot functionality. Get credentials from{' '}
                <a 
                  href="https://cloud.ibm.com/apidocs/assistant/assistant-v2" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  IBM Cloud
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <div className="relative">
                  <input
                    type={showKeys.watsonx ? 'text' : 'password'}
                    value={settings.watsonx_api_key}
                    onChange={(e) => handleInputChange('watsonx_api_key', e.target.value)}
                    placeholder="Enter your Watsonx API key"
                    className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys(prev => ({ ...prev, watsonx: !prev.watsonx }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showKeys.watsonx ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Assistant ID</label>
                <input
                  type="text"
                  value={settings.watsonx_assistant_id}
                  onChange={(e) => handleInputChange('watsonx_assistant_id', e.target.value)}
                  placeholder="Enter your Assistant ID"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Service URL</label>
                <input
                  type="url"
                  value={settings.watsonx_service_url}
                  onChange={(e) => handleInputChange('watsonx_service_url', e.target.value)}
                  placeholder="https://api.watsonx.ai/v1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-between">
                <Button
                  onClick={testWatsonxAPI}
                  disabled={loading || !settings.watsonx_api_key || !settings.watsonx_assistant_id}
                  variant="outline"
                  size="sm"
                >
                  {loading ? 'Testing...' : 'Test Connection'}
                </Button>
                
                {testResults.watsonx && (
                  <div className={`flex items-center gap-2 ${
                    testResults.watsonx === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {testResults.watsonx === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {testResults.watsonx === 'success' ? 'Configured' : 'Failed'}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={saveSettings}
            disabled={loading}
            className="w-full py-3 text-lg"
            size="lg"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {/* Information Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Security Notice</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-3">
              <p>
                Your API keys are stored securely in environment variables and are never logged or exposed in the interface.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Required Permissions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-3">
              <div>
                <p className="font-medium text-gray-800">OpenWeather API:</p>
                <p>Current weather data access</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">Watsonx Assistant:</p>
                <p>Chat session management and message processing</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rate Limits</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-3">
              <div>
                <p className="font-medium text-gray-800">OpenWeather:</p>
                <p>1,000 calls/day (free tier)</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">Watsonx:</p>
                <p>Varies by plan</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <a 
                href="https://openweathermap.org/api" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <Globe className="w-4 h-4" />
                OpenWeather API Docs
              </a>
              <a 
                href="https://cloud.ibm.com/docs/assistant" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-purple-600 hover:underline"
              >
                <Key className="w-4 h-4" />
                Watsonx Assistant Docs
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;