export interface WeatherData {
  location: string;
  country: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction: number;
  visibility: number | string;
  description: string;
  icon: string;
  uv_index: number | string;
  last_updated: string;
}

export interface WeatherForecast {
  datetime: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  description: string;
  icon: string;
}

export interface DatasetAnalysis {
  shape: [number, number];
  memory_usage: number;
  dtypes: Array<{
    column: string;
    dtype: string;
    non_null_count: number;
    null_count: number;
    unique_values: number;
  }>;
  summary_stats: Record<string, {
    count: number;
    mean: number;
    std: number;
    min: number;
    max: number;
    q25: number;
    median: number;
    q75: number;
    skewness: number;
    kurtosis: number;
  }>;
  missing_values: Record<string, number>;
  duplicate_rows: number;
  visualizations: {
    histograms: Array<any>;
    time_series: Array<any>;
    correlation_heatmap: any;
    box_plots: Array<any>;
    categorical_analysis: Array<any>;
  };
}

export interface MLModelResult {
  success: boolean;
  model_name?: string;
  metrics?: Record<string, number>;
  visualizations?: Array<any>;
  error?: string;
  message?: string;
}

export interface APISettings {
  openweather_api_key: string;
  watsonx_api_key: string;
  watsonx_assistant_id: string;
  watsonx_service_url: string;
}