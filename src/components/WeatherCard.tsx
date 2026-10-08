import React from 'react';
import { Card } from './ui/card';
import { cn, formatTemperature, getWeatherIcon } from '../lib/utils';
import { WeatherData } from '../types/weather';

interface WeatherCardProps {
  weather: WeatherData | null;
  loading?: boolean;
}

interface WeatherDetailItemProps {
  icon: string;
  label: string;
  value: string | number;
  unit?: string;
}

const WeatherDetailItem: React.FC<WeatherDetailItemProps> = ({ icon, label, value, unit }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-white/10 backdrop-blur-sm">
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium text-white/90">{label}</span>
    </div>
    <span className="text-sm font-semibold text-white">
      {value}{unit}
    </span>
  </div>
);

const WeatherCard: React.FC<WeatherCardProps> = ({ weather, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main weather card skeleton */}
        <div className="lg:col-span-2">
          <Card className="h-80 bg-gradient-to-br from-blue-500 to-purple-600 border-0 animate-pulse">
            <div className="p-8 h-full flex flex-col justify-between text-white">
              <div className="space-y-4">
                <div className="h-6 bg-white/20 rounded w-48"></div>
                <div className="h-20 bg-white/20 rounded w-32"></div>
                <div className="h-4 bg-white/20 rounded w-64"></div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Details card skeleton */}
        <div>
          <Card className="h-80 bg-gray-100 border-0 animate-pulse">
            <div className="p-6 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <Card className="h-64 bg-gradient-to-br from-gray-400 to-gray-600 border-0">
            <div className="p-8 h-full flex flex-col items-center justify-center text-white">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold mb-2">Weather Data Unavailable</h3>
              <p className="text-white/80 text-center max-w-md">
                Unable to fetch current weather data. Please check your API settings or try again later.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const gradientClass = cn(
    "bg-gradient-to-br border-0",
    weather.description.toLowerCase().includes('clear') && "from-blue-400 to-blue-600",
    weather.description.toLowerCase().includes('cloud') && "from-gray-400 to-gray-600",
    weather.description.toLowerCase().includes('rain') && "from-blue-600 to-indigo-800",
    weather.description.toLowerCase().includes('snow') && "from-blue-200 to-blue-400",
    weather.description.toLowerCase().includes('thunder') && "from-purple-600 to-indigo-900",
    !weather.description.toLowerCase().includes('clear') && 
    !weather.description.toLowerCase().includes('cloud') && 
    !weather.description.toLowerCase().includes('rain') && 
    !weather.description.toLowerCase().includes('snow') && 
    !weather.description.toLowerCase().includes('thunder') && "from-blue-500 to-purple-600"
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Weather Card */}
      <div className="lg:col-span-2">
        <Card className={cn("h-80 overflow-hidden", gradientClass)}>
          <div className="p-8 h-full flex flex-col justify-between text-white relative">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 right-10 text-8xl">
                {getWeatherIcon(weather.description)}
              </div>
            </div>
            
            <div className="relative z-10">
              <div className="space-y-2 mb-6">
                <h2 className="text-lg font-medium text-white/90">
                  {weather.location}, {weather.country}
                </h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-thin">
                    {formatTemperature(weather.temperature)}
                  </span>
                  <span className="text-3xl text-white/70">
                    {getWeatherIcon(weather.description)}
                  </span>
                </div>
                <p className="text-xl font-medium text-white/90 capitalize">
                  {weather.description}
                </p>
              </div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between text-sm text-white/80">
                <span>Feels like {formatTemperature(weather.feels_like)}</span>
                <span>Updated: {new Date(weather.last_updated).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Weather Details Card */}
      <div>
        <Card className="h-80 bg-gray-50/50 backdrop-blur-sm border-0 overflow-hidden">
          <div className="p-6 h-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Weather Details</h3>
            <div className="space-y-3">
              <WeatherDetailItem
                icon="💧"
                label="Humidity"
                value={weather.humidity}
                unit="%"
              />
              <WeatherDetailItem
                icon="🌡️"
                label="Pressure"
                value={weather.pressure}
                unit=" hPa"
              />
              <WeatherDetailItem
                icon="💨"
                label="Wind Speed"
                value={weather.wind_speed}
                unit=" m/s"
              />
              <WeatherDetailItem
                icon="👁️"
                label="Visibility"
                value={weather.visibility}
                unit={typeof weather.visibility === 'number' ? ' km' : ''}
              />
              <WeatherDetailItem
                icon="☀️"
                label="UV Index"
                value={weather.uv_index}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WeatherCard;