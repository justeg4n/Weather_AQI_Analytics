import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import WeatherCard from '../WeatherCard';
import { WeatherData } from '../../types/weather';
import { BarChart3, Brain, Settings, ArrowRight } from 'lucide-react';
import axios from 'axios';

interface HomeTabProps {
  onTabChange: (tab: string) => void;
}

const HomeTab: React.FC<HomeTabProps> = ({ onTabChange }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/weather/current');
      setWeather(response.data);
    } catch (err: any) {
      console.error('Error fetching weather data:', err);
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Weather Dashboard
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your comprehensive weather analysis and forecasting platform powered by machine learning
        </p>
      </div>

      {/* Current Weather Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-800">
            Current Weather - Ho Chi Minh City
          </h3>
          <Button
            onClick={fetchWeatherData}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        
        <WeatherCard weather={weather} loading={loading} />
        
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <span className="text-red-500">⚠️</span>
                <div>
                  <p className="text-red-800 font-medium">Weather data unavailable</p>
                  <p className="text-red-600 text-sm">
                    {error}. Please check your API settings or try again later.
                  </p>
                </div>
                <Button
                  onClick={() => onTabChange('settings')}
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                >
                  Check API Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-gray-800">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-gradient-to-br from-blue-50 to-blue-100" onClick={() => onTabChange('data')}>
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">Analyze Weather Data</CardTitle>
              <CardDescription>
                Upload your dataset or use our default data to explore weather patterns and trends.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-blue-600 font-medium group-hover:gap-3 transition-all">
                <span>Start Analysis</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-gradient-to-br from-purple-50 to-purple-100" onClick={() => onTabChange('forecast')}>
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">Weather Forecasting</CardTitle>
              <CardDescription>
                Use machine learning models to predict weather conditions and make accurate forecasts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-purple-600 font-medium group-hover:gap-3 transition-all">
                <span>Create Forecast</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-gradient-to-br from-orange-50 to-orange-100" onClick={() => onTabChange('settings')}>
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">Configure APIs</CardTitle>
              <CardDescription>
                Set up your OpenWeather and Watsonx API credentials for full functionality.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-orange-600 font-medium group-hover:gap-3 transition-all">
                <span>Configure APIs</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Overview */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-gray-800">Platform Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-green-800">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                Data Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Upload custom CSV datasets
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Comprehensive statistical analysis
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Interactive visualizations
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Correlation analysis
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-indigo-50 to-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-indigo-800">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                Machine Learning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-indigo-700">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                Multiple ML algorithms
              </div>
              <div className="flex items-center gap-2 text-sm text-indigo-700">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                Custom model training
              </div>
              <div className="flex items-center gap-2 text-sm text-indigo-700">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                Model export and import
              </div>
              <div className="flex items-center gap-2 text-sm text-indigo-700">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                Real-time predictions
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomeTab;