import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from './AuthPageLayout';
import { postService } from '../../../../constants/Service';
import apiName from '../../../../constants/ApiName';
import { showToast } from '../../../../components/Toast';
import { useUserContext } from '../../../../context/UserContext';

const validationSchema = Yup.object().shape({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

const SignInForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setSchoolData } = useUserContext();

  const handleLogin = async (values) => {
    if (!values.username || !values.password) {
      showToast('All fields are required', 'error');
      return;
    }

    const body = {
      username: values.username,
      password: values.password,
      role: "superadmin"
    };

    try {
      const response = await postService(apiName.adminLogin, body);
      console.log('responseresponse', response);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token); // Save token to sessionStorage
        localStorage.setItem("role", response.data.user?.role); // Save token to sessionStorage
        setSchoolData(response.data.tenant);
        showToast("Login successfully.", 'success');
        navigate("/admin/home");
      } else {
        console.log("Admin Login Error:", response.error);
      }
    } catch (error) {
      showToast(error.response?.data?.message, 'error');
      console.error('Error posting data:', error);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col flex-1">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div>
            <h1 className="mb-2 font-semibold text-gray-800 dark:text-gray-100 text-title-md">Admin Login</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Enter your username and password to sign in!</p>
          </div>
          <Formik
            initialValues={{ username: '', password: '' }}
            validationSchema={validationSchema}
            onSubmit={handleLogin}
          >
            {() => (
              <Form className="space-y-6">
                {/* Username Field */}
                <div>
                  <label className="block mb-2 text-gray-700 dark:text-gray-300">Username</label>
                  <Field
                    name="username"
                    className="w-full p-2 border rounded text-gray-900 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Enter your username"
                  />
                  <ErrorMessage name="username" component="div" className="text-red-500 text-sm" />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block mb-2 text-gray-700 dark:text-gray-300">Password</label>
                  <div className="relative">
                    <Field
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className="w-full p-2 border rounded text-gray-900 dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="Enter your password"
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-2 cursor-pointer text-gray-600 dark:text-gray-300"
                    >
                      {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                    </span>
                  </div>
                  <ErrorMessage name="password" component="div" className="text-red-500 text-sm" />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
               <button
                  onClick={() => navigate("/student")} // Navigate back to the previous page
                  className="w-full border border-gray-500 text-black dark:text-white py-2 rounded transition mt-4"
                  disabled={loading}
                >
                  Login As Student
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </AuthLayout>
  );
};

export default SignInForm;
