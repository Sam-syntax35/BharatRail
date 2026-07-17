import client from './client';

export const authApi = {
  sendOtp: (data) => client.post('/users/auth/send-otp', data).then((res) => res.data),
  verifyOtp: (otp) => client.post('/users/auth/verify-otp', { otp }).then((res) => res.data),
  login: (email, password) => client.post('/users/auth/login', { email, password }).then((res) => res.data),
  googleAuth: (idToken) => client.post('/users/auth/google-auth', { idToken }).then((res) => res.data),
  getProfile: () => client.get('/users/user/profile').then((res) => res.data),
  updateProfile: (data) => client.put('/users/user/profile', data).then((res) => res.data),
  deleteProfile: () => client.delete('/users/user/profile').then((res) => res.data),
  logout: () => client.post('/users/auth/logout').then((res) => res.data),
};
