import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import RequireAuth from './components/RequireAuth';
import SplashScreen from './components/screens/SplashScreen';
import OnboardScreen from './components/screens/OnboardScreen';
import FlightScreen from './components/screens/FlightScreen';
import IntentScreen from './components/screens/IntentScreen';
import FeedScreen from './components/screens/FeedScreen';
import ProfileScreen from './components/screens/ProfileScreen';
import ChatScreen from './components/screens/ChatScreen';
import EditProfileScreen from './components/screens/EditProfileScreen';

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {/* Public */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/welcome" element={<OnboardScreen />} />

          {/* Authenticated app */}
          <Route path="/flight" element={<RequireAuth><FlightScreen /></RequireAuth>} />
          <Route path="/intent" element={<RequireAuth><IntentScreen /></RequireAuth>} />
          <Route path="/feed" element={<RequireAuth><FeedScreen /></RequireAuth>} />
          <Route path="/me" element={<RequireAuth><EditProfileScreen /></RequireAuth>} />
          <Route path="/profile/:id" element={<RequireAuth><ProfileScreen /></RequireAuth>} />
          <Route path="/chat/:id" element={<RequireAuth><ChatScreen /></RequireAuth>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
