import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { SavedRecap } from '../types';
import { Film, Loader2, ServerCrash, Clipboard, Lock } from 'lucide-react';

const SavedRecapCard = ({ recap }: { recap: SavedRecap }) => {
  const [isCopied, setIsCopied] = useState(false);
  const videoUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${recap.video_path}`;

  const handleCopy = () => {
    // This might be blocked in dev environment, but will work on the live site.
    navigator.clipboard.writeText(recap.script).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy script:', err);
      alert('לא ניתן להעתיק את התסריט. ייתכן שהדפדפן חוסם פעולה זו בסביבת הפיתוח.');
    });
  };

  return (
    <motion.div 
      className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-3"
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      <video src={videoUrl} controls className="w-full rounded-md" preload="metadata"></video>
      <div>
        <p className="text-xs text-gray-400 mb-1">נוצר ב: {new Date(recap.created_at).toLocaleString('he-IL')}</p>
        <p className="text-sm text-gray-300 line-clamp-2" title={recap.description || ''}>
          <strong>תיאור מקורי:</strong> {recap.description || 'לא סופק'}
        </p>
      </div>
      <div className="relative">
        <textarea
          readOnly
          value={recap.script}
          className="w-full h-24 bg-gray-900 text-gray-300 p-2 rounded-lg border border-gray-600 resize-none text-sm"
        />
        <button
          onClick={handleCopy}
          className="absolute top-2 left-2 p-1.5 bg-gray-700 rounded-md text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
          title="העתק תסריט"
        >
          {isCopied ? <Clipboard className="h-4 w-4 text-green-400" /> : <Clipboard className="h-4 w-4" />}
        </button>
      </div>
    </motion.div>
  );
};

const SavedRecaps = () => {
  const [savedRecaps, setSavedRecaps] = useState<SavedRecap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecaps = async () => {
      setLoading(true);
      const visitorId = localStorage.getItem('visitor_id');

      if (!visitorId) {
        setSavedRecaps([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('generated_recaps')
        .select('*')
        .eq('visitor_id', visitorId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching saved recaps:', error);
        setError('שגיאה בטעינת הסיכומים השמורים.');
      } else {
        setSavedRecaps(data);
      }
      setLoading(false);
    };

    fetchRecaps();

    const visitorId = localStorage.getItem('visitor_id');
    const channel = supabase
      .channel('saved_recaps_realtime_private')
      .on<SavedRecap>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'generated_recaps' },
        (payload) => {
          if (payload.new.visitor_id === visitorId) {
            setSavedRecaps(prevRecaps => [payload.new, ...prevRecaps]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
          <Lock className="h-8 w-8 text-blue-400" />
          הסיכומים השמורים שלי
        </h2>
        <p className="text-gray-400 text-lg">
          הסיכומים שיצרת שמורים כאן באופן פרטי ובטוח. רק לך יש גישה אליהם.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center items-center p-10">
          <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-lg text-center">
          <ServerCrash className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && savedRecaps.length === 0 && (
        <div className="bg-gray-800 border border-gray-700 p-10 rounded-lg text-center">
          <Film className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white">עדיין לא יצרת סיכומים</h3>
          <p className="text-gray-400 mt-2">הסיכום הבא שתיצור יופיע כאן באופן אוטומטי.</p>
        </div>
      )}

      {!loading && !error && savedRecaps.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedRecaps.map(recap => (
            <SavedRecapCard key={recap.id} recap={recap} />
          ))}
        </div>
      )}
    </section>
  );
};

export default SavedRecaps;
