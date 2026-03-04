import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const navigate = useNavigate();

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await recaptchaRef.current?.executeAsync();
      if (!token) {
        setError('reCAPTCHA נכשל. נסה שוב.');
        return;
      }
      console.log('reCAPTCHA token:', token); // Send to backend for verification if needed
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-lg mt-10">
      <h2 className="text-2xl text-white mb-4">התחבר / הירשם</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <form onSubmit={handleEmailSignup} className="space-y-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
          דוא"ל
        </label>
        <input
          id="email"
          type="email"
          placeholder='הזן דוא"ל'
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500"
          required
        />
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
          סיסמה
        </label>
        <input
          id="password"
          type="password"
          placeholder='הזן סיסמה'
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500"
          required
          minLength={6}
        />
        <button
          type="submit"
          className="w-full bg-blue-600 py-2 rounded text-white"
        >
          הירשם באמצעות דוא\"ל
        </button>
      </form>
      <ReCAPTCHA
        ref={recaptchaRef}
        size="invisible"
        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY as string}
      />
      <div className="mt-6 text-center">
        <button
          onClick={handleGoogle}
          className="w-full bg-red-600 py-2 rounded text-white"
        >
          התחבר עם Google
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
