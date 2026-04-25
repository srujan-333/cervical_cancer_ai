import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLogin, setIsLogin] = useState(true);

  // We do NOT use useNavigate here because App.jsx handles the switch
  const { login, register } = useAuth();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email';
    if (!password) newErrors.password = 'Password required';
    else if (password.length < 6) newErrors.password = 'Min 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the highlighted errors",
        variant: "destructive"
      });
      return;
    }

    // This call updates the state in AuthContext, which App.jsx listens to
    let result = isLogin ? await login(email, password) : await register(email, password);

    if (result.success) {
      if (isLogin) {
        toast({ title: "Login Successful", description: "Welcome back!" });
        // No navigate needed! App.jsx will now show <DashboardPage />
      } else {
        toast({ title: "Account Created", description: "Now login with your credentials" });
        setIsLogin(true);
      }
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - Cervical Cancer System</title>
      </Helmet>

      {/* Light Background */}
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#F3F4F6]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* White Card with Soft Shadow */}
          <div className="bg-white shadow-2xl shadow-slate-200 border border-slate-100 rounded-3xl p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="text-slate-500 mt-2">
                {isLogin ? "Login to access the system" : "Register a new medical account"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* EMAIL */}
              <div>
                <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    placeholder="Enter Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.email}</p>
                )}
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    placeholder='Enter Password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all"
                  />
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{errors.password}</p>
                )}
              </div>

              <Button 
                type="submit"
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-7 rounded-xl transition-all shadow-lg shadow-pink-100 active:scale-[0.98]"
              >
                {isLogin ? "Sign In" : "Register Account"}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-50 text-center">
              <p
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-semibold text-pink-600 hover:text-pink-700 cursor-pointer transition-colors"
              >
                {isLogin
                  ? "Don't have an account? Create one"
                  : "Already registered? Sign in here"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;