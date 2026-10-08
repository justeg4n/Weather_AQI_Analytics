import React, { useState } from 'react';
import { Tabs, TabsContent } from './components/ui/tabs';
import Navigation from './components/Navigation';
import HomeTab from './components/tabs/HomeTab';
import DataTab from './components/tabs/DataTab';
import ForecastTab from './components/tabs/ForecastTab';
import SettingsTab from './components/tabs/SettingsTab';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="container mx-auto px-4 py-8">
          <TabsContent value="home" className="mt-0">
            <HomeTab onTabChange={setActiveTab} />
          </TabsContent>
          
          <TabsContent value="data" className="mt-0">
            <DataTab />
          </TabsContent>
          
          <TabsContent value="forecast" className="mt-0">
            <ForecastTab />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-0">
            <SettingsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default App;