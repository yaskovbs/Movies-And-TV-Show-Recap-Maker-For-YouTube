import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './components/HomePage'
import ContactPage from './components/ContactPage'
import FAQPage from './components/FAQPage'
import Footer from './components/Footer'
import TermsOfServicePage from './components/TermsOfServicePage'
import PrivacyPolicyPage from './components/PrivacyPolicyPage'
import VoiceoverPage from './components/VoiceoverPage'
import AuthPage from './components/AuthPage'
import APIKeysSettings from './components/APIKeysSettings'
import StorageSettings from './components/StorageSettings'
import { supabase } from './lib/supabase'

function App() {
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    const registerVisitor = async () => {
      try {
        let visitorId = localStorage.getItem('visitor_id');
        if (!visitorId) {
          visitorId = crypto.randomUUID();
          localStorage.setItem('visitor_id', visitorId);
          
          const { error } = await supabase.from('unique_visitors').insert({ visitor_id: visitorId });
          if (error && error.code !== '23505') {
            console.error('Error registering visitor:', error);
          }
        }
      } catch (e) {
        console.error('Failed to register visitor:', e);
      }
    };
    registerVisitor();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
      />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage apiKey={apiKey} />} />
          <Route path="/voiceover" element={<VoiceoverPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/settings/api-keys" element={<APIKeysSettings />} />
          <Route path="/settings/storage" element={<StorageSettings />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
