import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Database, FileText, BarChart3 } from 'lucide-react';
import { DatasetAnalysis } from '../../types/weather';

const DataTab: React.FC = () => {
  const [analysis, setAnalysis] = useState<DatasetAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [showColabNotebook, setShowColabNotebook] = useState(false);

  const handleUseDefault = async () => {
    try {
      setLoading(true);
      // Clear previous analysis and show Colab notebook
      setAnalysis(null);
      setShowColabNotebook(true);
    } catch (error) {
      console.error('Error loading Colab notebook:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-800">Weather Data Analysis</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore our comprehensive Ho Chi Minh City weather dataset with detailed analysis and insights
        </p>
      </div>

      {/* Dataset Selection */}
      <div className="flex justify-center">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-600" />
              Use Default Dataset
            </CardTitle>
            <CardDescription>
              Analyze our Ho Chi Minh City weather data with comprehensive measurements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleUseDefault}
              disabled={loading}
              className="w-full"
              variant="default"
            >
              {loading ? 'Analyzing...' : 'Use Default Dataset'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Google Colab Notebook */}
      {showColabNotebook && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-gray-800">Weather Data Analysis Notebook</h3>
            <p className="text-gray-600">Interactive analysis and visualization of weather data patterns</p>
          </div>
          
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Google Colab Notebook - Weather Data Analysis
              </CardTitle>
              <CardDescription>
                Explore weather patterns, perform statistical analysis, and create visualizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[800px] border-2 border-blue-200 rounded-lg overflow-hidden">
                <iframe
                  src="https://colab.research.google.com/drive/1ZXxmlZ2jOEP7foYDhmFxZKSlEIETrajt?usp=sharing"
                  width="100%"
                  height="100%"
                  className="border-0"
                  title="Weather Data Analysis Notebook"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="mt-4 text-sm text-gray-600 text-center">
                <p>
                  <strong>Note:</strong> This notebook contains comprehensive weather data analysis including 
                  data cleaning, statistical analysis, and interactive visualizations.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}


    </div>
  );
};

export default DataTab;