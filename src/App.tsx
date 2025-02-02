import React, { useState, useEffect } from 'react';
import { LogIn } from 'lucide-react';
import { supabase } from './lib/supabase';

interface IpLog {
  ip: string;
  city: string | null;
  country: string | null;
  created_at: string;
  email: string | null;
}

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ipLogs, setIpLogs] = useState<IpLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentIp, setCurrentIp] = useState<string | null>(null);
  const [hasLogged, setHasLogged] = useState(false);

  useEffect(() => {
    const logIpAddress = async () => {
      // Prevent duplicate logging
      if (hasLogged) return;
      
      try {
        // Get IPv4 address first
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        setCurrentIp(ipData.ip);
        
        // Get location data
        const geoResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
        const geoData = await geoResponse.json();
        
        if (geoData.error) {
          throw new Error('Failed to get location data');
        }
        
        // Log the IP with location data
        await supabase.from('ip_logs').insert([{
          ip: ipData.ip,
          city: geoData.city,
          country: geoData.country_name,
          user_agent: navigator.userAgent,
          email: null // Initial log with no email
        }]);
        
        setHasLogged(true);
      } catch (err) {
        console.error('Failed to log IP:', err);
        // Continue showing the app even if logging fails
      }
    };

    logIpAddress();
  }, [hasLogged]); // Only re-run if hasLogged changes

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log the login attempt with the email and location
    if (currentIp) {
      try {
        const geoResponse = await fetch(`https://ipapi.co/${currentIp}/json/`);
        const geoData = await geoResponse.json();
        
        if (!geoData.error) {
          await supabase.from('ip_logs').insert([{
            ip: currentIp,
            city: geoData.city,
            country: geoData.country_name,
            email: email,
            user_agent: navigator.userAgent
          }]);
        }
      } catch (err) {
        console.error('Failed to log login attempt:', err);
        // Continue with login even if logging fails
      }
    }

    if (email === 'admin' && password === 'admin') {
      setIsAdmin(true);
      setShowLogin(false);
      
      // Fetch all IP logs for admin
      const { data } = await supabase
        .from('ip_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setIpLogs(data);
      }
    } else {
      setError('Invalid credentials');
    }
  };

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login / Sign Up</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter password"
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Sign In / Sign Up
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">IP Logs Dashboard</h1>
            <button
              onClick={() => setIsAdmin(false)}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ipLogs.map((log, index) => (
                  <tr key={`${log.created_at}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.ip}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {[log.city, log.country].filter(Boolean).join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col">
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowLogin(true)}
          className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <LogIn className="w-5 h-5" />
          <span>Sign In</span>
        </button>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-6 tracking-tight">
            Congratulations!
          </h1>
          <p className="text-2xl text-white/90 font-light">
            Your IP address has been successfully logged
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;