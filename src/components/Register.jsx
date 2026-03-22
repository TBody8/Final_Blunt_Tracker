import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

function Register({ onRegister, onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const isBannedLocally = localStorage.getItem('mt_uuid_ban') === 'true';
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      
      const res = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          username, 
          password,
          mt_uuid_ban: isBannedLocally
        }),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Respuesta inesperada del servidor: ' + text);
      }
      if (!res.ok) {
        throw data.detail;
      }
      setSuccess('Registration successful! Logging in...');
      setTimeout(() => {
        // JWT is managed by HttpOnly cookies now
        onRegister(data.user);
      }, 1000);
    } catch (err) {
      if (typeof err === 'object' && err !== null && err.message) {
         setError(err.message);
         if (err.ban_until || err.message === 'Permaban por tonto' || err.message === 'User is temporarily suspended.') {
             window.dispatchEvent(new CustomEvent('userBanned', { detail: { message: err.message, ban_until: err.ban_until || null } }));
         }
      } else {
         setError(err.message || String(err));
         if (err === 'Permaban por tonto') {
             window.dispatchEvent(new CustomEvent('userBanned', { detail: err }));
         }
      }
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-black text-white p-4 relative overflow-hidden'>
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <form
        onSubmit={handleSubmit}
        className='bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6 md:p-8 rounded-2xl border border-green-500/20 shadow-[0_0_30px_rgba(0,255,65,0.1)] w-full max-w-sm relative z-10'
      >
        <div className="text-center mb-6">
          <h2 className='text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 blunt-title tracking-wider'>Join The Circle</h2>
          <p className="text-gray-400 text-sm mt-1">Register a new account</p>
        </div>
        {error && <div className='mb-4 text-red-400'>{error}</div>}
        {success && <div className='mb-4 text-green-400'>{success}</div>}
        <div className='mb-4'>
          <label className='block mb-1'>Username</label>
          <input
            type='text'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className='w-full p-3 rounded-xl bg-gray-950/80 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all'
            required
          />
        </div>
        <div className='mb-6'>
          <label className='block mb-1'>Password</label>
          <div className='relative'>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full p-3 pr-10 rounded-xl bg-gray-950/80 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all'
              required
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none'
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        <button
          type='submit'
          className='w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(0,255,65,0.3)] hover:shadow-[0_0_25px_rgba(0,255,65,0.5)]'
        >
          Create Account
        </button>
        <button
          type='button'
          onClick={onSwitchToLogin}
          className='w-full mt-4 text-green-400 hover:underline'
        >
          Already have an account? Login
        </button>
      </form>
    </div>
  );
}

export default Register;
