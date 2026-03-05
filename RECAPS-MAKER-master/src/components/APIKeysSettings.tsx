import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Key, Save, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react'

interface APIKey {
  name: string;
  key: string;
  url: string;
  description: string;
  storageKey: string;
  isValid?: boolean;
}

const APIKeysSettings = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      name: 'Gemini API',
      key: '',
      url: 'https://ai.google.dev/tutorials/setup',
      description: 'Used for scene analysis and content understanding',
      storageKey: 'gemini_api_key',
    },
    {
      name: 'Supabase URL',
      key: '',
      url: 'https://supabase.com/dashboard',
      description: 'Your Supabase project URL',
      storageKey: 'supabase_url',
    },
    {
      name: 'Supabase Anon Key',
      key: '',
      url: 'https://supabase.com/dashboard',
      description: 'Your Supabase anonymous key',
      storageKey: 'supabase_anon_key',
    },
    {
      name: 'Firebase API Key',
      key: '',
      url: 'https://console.firebase.google.com/',
      description: 'Used for authentication and storage',
      storageKey: 'firebase_api_key',
    },
    {
      name: 'OpenAI API Key',
      key: '',
      url: 'https://platform.openai.com/api-keys',
      description: 'Optional: Used for advanced voiceovers',
      storageKey: 'openai_api_key',
    }
  ]);
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Load saved keys on component mount
  useEffect(() => {
    const loadedKeys = apiKeys.map(key => {
      const savedValue = localStorage.getItem(key.storageKey) || '';
      return { ...key, key: savedValue };
    });
    
    setApiKeys(loadedKeys);
  }, []);

  const handleKeyChange = (index: number, value: string) => {
    const updatedKeys = [...apiKeys];
    updatedKeys[index].key = value;
    setApiKeys(updatedKeys);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    
    try {
      // Save all keys to localStorage
      apiKeys.forEach(key => {
        if (key.key) {
          localStorage.setItem(key.storageKey, key.key);
        }
      });
      
      // Validate keys if possible (simplified example)
      // In a real implementation, you would test each API key with a simple request
      
      setSaveStatus('success');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error saving API keys:', error);
      setSaveStatus('error');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  };

  const toggleSection = (name: string) => {
    if (expandedSection === name) {
      setExpandedSection(null);
    } else {
      setExpandedSection(name);
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
        <Key className="w-6 h-6 mr-2 text-blue-600" />
        <h2 className="text-2xl font-bold">API Keys Settings</h2>
      </div>
      
      <p className="mb-6 text-gray-600">
        Enter your API keys below to enable advanced features. Your keys are stored locally in your browser and are never sent to our servers.
      </p>
      
      <div className="space-y-6">
        {apiKeys.map((apiKey, index) => (
          <div key={apiKey.storageKey} className="border border-gray-200 rounded-lg p-4">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection(apiKey.name)}
            >
              <div>
                <h3 className="text-lg font-medium">{apiKey.name}</h3>
                <p className="text-sm text-gray-500">{apiKey.description}</p>
              </div>
              {apiKey.isValid === true && <CheckCircle className="w-5 h-5 text-green-500" />}
              {apiKey.isValid === false && <AlertCircle className="w-5 h-5 text-red-500" />}
            </div>
            
            {(expandedSection === apiKey.name || !expandedSection) && (
              <div className="mt-4">
                <div className="flex flex-col space-y-2">
                  <label htmlFor={`api-key-${index}`} className="text-sm font-medium text-gray-700">
                    API Key
                  </label>
                  <div className="flex">
                    <input
                      id={`api-key-${index}`}
                      type="password"
                      value={apiKey.key}
                      onChange={(e) => handleKeyChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter your ${apiKey.name}...`}
                    />
                    <a
                      href={apiKey.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 transition-colors"
                      title={`Get ${apiKey.name}`}
                    >
                      <ExternalLink className="w-5 h-5 text-gray-600" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
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
              <CheckCircle className="w-5 h-5 mr-2" />
              Saved!
            </>
          ) : saveStatus === 'error' ? (
            <>
              <AlertCircle className="w-5 h-5 mr-2" />
              Error Saving
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save API Keys
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default APIKeysSettings;