import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { loginSchema } from '../../features/auth/schemas';
import AuthLayout from '../../features/auth/AuthLayout';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import api from '../../lib/axios';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      await api.post('/auth/login', {
        email: data.email,
        password: data.password
      });
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch {
      toast.error('Invalid credentials');
    }
  };

  // Function to handle Google Success
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log("Google Token:", credentialResponse.credential);
      
      // Send the Google Token to YOUR Backend
      const res = await api.post('/auth/google', {
        token: credentialResponse.credential
      });

      // Save YOUR app's token (not Google's)
      localStorage.setItem('token', res.data.token);
      toast.success('Google Login Successful!');
      navigate('/dashboard');
      
    } catch (error) {
      console.error("Login failed", error);
      toast.error('Google authentication failed');
    }
  };

  return (
    <AuthLayout 
      title="Sign in to your account" 
      subtitle={
        <>
          Or <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">create a new account</Link>
        </>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Email address"
          type="email"
          icon={Mail}
          placeholder="student@example.com"
          error={errors.email}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          error={errors.password}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>
          <div className="text-sm">
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
              Forgot your password?
            </a>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              toast.error('Login Failed');
            }}
            useOneTap
            width="300"
          />
        </div>
      </form>
    </AuthLayout>
  );
}