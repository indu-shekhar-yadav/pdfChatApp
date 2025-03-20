// import React, { useState } from 'react';
// import axios from 'axios';

// const AuthForm = ({ setToken }) => {
//   const [isSignup, setIsSignup] = useState(false);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
//       const res = await axios.post(`http://localhost:5000${endpoint}`, { email, password });
//       const token = res.data.token;
//       if (token) {
//         localStorage.setItem('token', token);
//         setToken(token);
//         setError('');
//       } else {
//         setError('No token received from server');
//       }
//     } catch (err) {
//       console.error('Login/Signup error:', err.response?.data || err.message);
//       setError(err.response?.data?.msg || 'An error occurred');
//     }
//   };

//   return (
//     <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
//       <h2 className="text-2xl font-semibold text-primary mb-4">
//         {isSignup ? 'Sign Up' : 'Login'}
//       </h2>
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <input
//           type="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           placeholder="Email"
//           className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
//           required
//         />
//         <input
//           type="password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           placeholder="Password"
//           className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
//           required
//         />
//         {error && <p className="text-red-500">{error}</p>}
//         <button
//           type="submit"
//           className="w-full bg-primary text-white p-2 rounded hover:bg-indigo-700"
//         >
//           {isSignup ? 'Sign Up' : 'Login'}
//         </button>
//       </form>
//       <p className="mt-2 text-center">
//         {isSignup ? 'Already have an account?' : "Don't have an account?"}
//         <button
//           onClick={() => setIsSignup(!isSignup)}
//           className="text-primary ml-1 hover:underline"
//         >
//           {isSignup ? 'Login' : 'Sign Up'}
//         </button>
//       </p>
//     </div>
//   );
// };

// export default AuthForm;