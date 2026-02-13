import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock, Loader2 } from 'lucide-react';
import { registerSchema } from '../../features/auth/schemas';
import AuthLayout from '../../features/auth/AuthLayout';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import api from '../../lib/axios';

export default function RegisterPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

const onSubmit = async (data) => {
  try {
    // Matches the DTO structure in Java
    await api.post('/auth/register', {
      fullName: data.fullName,
      email: data.email,
      password: data.password
    });
    
    toast.success('Account created! Please login.');
    navigate('/login'); // Redirect to login
  } catch (error) {
    toast.error(error.response?.data || 'Registration failed');
  }
};

  return (
    <AuthLayout 
      title="Create your account" 
      subtitle={
        <>
          Already have an account? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Sign in</Link>
        </>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Full Name"
          type="text"
          icon={User}
          placeholder="John Doe"
          error={errors.fullName}
          {...register('fullName')}
        />

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

        <Input
          label="Confirm Password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          error={errors.confirmPassword}
          {...register('confirmPassword')}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}