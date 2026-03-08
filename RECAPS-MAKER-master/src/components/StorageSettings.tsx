import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Database, HardDrive, Save, Info } from 'lucide-react'

interface StorageSettings {
  chunkSize: number; // MB
  maxFileSize: number; // MB
  preferredStorage: 'supabase' | 'firebase' | 'local';
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
}

const StorageSettingsComponent = () => {
  const [settings, setSettings] = useState<StorageSettings>({
    chunkSize: 50,
    maxFileSize: 3072, // 3GB
    preferredStorage: 'supabase',
    compressionLevel: 'medium'
  });
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Load saved settings on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('storage_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Error parsing saved storage settings:', error);
      }
    }
  }, []);

  const handleSettingChange = (key: keyof StorageSettings, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    setSaveStatus('saving');
    
    try {
      localStorage.setItem('storage_settings', JSON.stringify(settings));
      setSaveStatus('success');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error saving storage settings:', error);
      setSaveStatus('error');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  };

  const getCompressionDescription = (level: string) => {
    switch (level) {
      case 'none':
        return 'No compression, preserves original quality';
      case 'low':
        return 'Light compression, minimal quality loss';
      case 'medium':
        return 'Balanced compression, good quality with smaller file size';
      case 'high':
        return 'Maximum compression, smaller files with noticeable quality reduction';
      default:
        return '';
    }
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center mb-6">
        <HardDrive className="w-6 h-6 mr-2 text-blue-600" />
        <h2 className="text-2xl font-bold">Storage Settings</h2>
      </div>
      
      <p className="mb-6 text-gray-600">
        Configure how your videos are stored and processed. These settings affect upload speed and storage usage.
      </p>
      
      <div className="space-y-8">
        {/* Preferred Storage */}
        <div>
          <h3 className="text-lg font-medium mb-3">Preferred Storage Service</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className={`border rounded-lg p-4 cursor-pointer ${
                settings.preferredStorage === 'supabase' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => handleSettingChange('preferredStorage', 'supabase')}
            >
              <div className="flex items-center mb-2">
                <Database className="w-5 h-5 mr-2 text-blue-600" />
                <h4 className="font-medium">Supabase</h4>
              </div>
              <p className="text-sm text-gray-600">
                Fast cloud storage with 3GB file limit
              </p>
            </div>
            
            <div 
              className={`border rounded-lg p-4 cursor-pointer ${
                settings.preferredStorage === 'firebase' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => handleSettingChange('preferredStorage', 'firebase')}
            >
              <div className="flex items-center mb-2">
                <Database className="w-5 h-5 mr-2 text-orange-500" />
                <h4 className="font-medium">Firebase</h4>
              </div>
              <p className="text-sm text-gray-600">
                Reliable storage with good global distribution
              </p>
            </div>
            
            <div 
              className={`border rounded-lg p-4 cursor-pointer ${
                settings.preferredStorage === 'local' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => handleSettingChange('preferredStorage', 'local')}
            >
              <div className="flex items-center mb-2">
                <HardDrive className="w-5 h-5 mr-2 text-gray-600" />
                <h4 className="font-medium">Local Storage</h4>
              </div>
              <p className="text-sm text-gray-600">
                Store in browser (limited space, but private)
              </p>
            </div>
          </div>
        </div>
        
        {/* Chunk Size */}
        <div>
          <div className="flex items-center mb-3">
            <h3 className="text-lg font-medium">Upload Chunk Size</h3>
            <div className="relative ml-2 group">
              <Info className="w-4 h-4 text-gray-400" />
              <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded hidden group-hover:block">
                Larger chunks upload faster but may fail more often on unstable connections. Smaller chunks are more reliable but slower.
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={settings.chunkSize}
              onChange={(e) => handleSettingChange('chunkSize', parseInt(e.target.value))}
              className="w-full max-w-md"
            />
            <span className="ml-4 min-w-[80px] text-center">
              {settings.chunkSize} MB
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {settings.chunkSize <= 20 ? 'More reliable for slow connections' : 
             settings.chunkSize >= 80 ? 'Faster for stable connections' : 
             'Balanced setting for most connections'}
          </p>
        </div>
        
        {/* Max File Size */}
        <div>
          <div className="flex items-center mb-3">
            <h3 className="text-lg font-medium">Maximum File Size</h3>
            <div className="relative ml-2 group">
              <Info className="w-4 h-4 text-gray-400" />
              <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded hidden group-hover:block">
                The maximum size of video files you can upload. Larger files require more browser resources.
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="range"
              min="1024"
              max="5120"
              step="512"
              value={settings.maxFileSize}
              onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
              className="w-full max-w-md"
            />
            <span className="ml-4 min-w-[80px] text-center">
              {(settings.maxFileSize / 1024).toFixed(1)} GB
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {settings.maxFileSize >= 4096 ? 'Warning: Very large files may cause browser performance issues' : 
             settings.maxFileSize <= 1024 ? 'Conservative setting, good for most devices' : 
             'Good balance between size and performance'}
          </p>
        </div>
        
        {/* Compression Level */}
        <div>
          <h3 className="text-lg font-medium mb-3">Video Compression</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['none', 'low', 'medium', 'high'] as const).map(level => (
              <div 
                key={level}
                className={`border rounded-lg p-4 cursor-pointer ${
                  settings.compressionLevel === level ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => handleSettingChange('compressionLevel', level)}
              >
                <h4 className="font-medium capitalize mb-1">{level}</h4>
                <p className="text-sm text-gray-600">
                  {getCompressionDescription(level)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className={`flex items-center px-4 py-2 rounded-md text-white ${
            saveStatus === 'error' ? 'bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
          } transition-colors`}
        >
          {saveStatus === 'saving' ? (
            <>
              <div className="w-5 h-5 mr-2 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
              Saving...
            </>
          ) : saveStatus === 'success' ? (
            <>
              <Save className="w-5 h-5 mr-2" />
              Saved!
            </>
          ) : saveStatus === 'error' ? (
            <>
              <Info className="w-5 h-5 mr-2" />
              Error Saving
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default StorageSettingsComponent;