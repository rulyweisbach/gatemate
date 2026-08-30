import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import RequireAuth from './components/RequireAuth';
import SplashScreen from './components/screens/SplashScreen';
import OnboardScreen from './components/screens/OnboardScreen';
import TripsListScreen from './components/screens/TripsListScreen';
import AddTripScreen from './components/screens/AddTripScreen';
import TripHubScreen from './components/screens/TripHubScreen';
import DiscoverScreen from './components/screens/DiscoverScreen';
import ChatsScreen from './components/screens/ChatsScreen';
import ProfileScreen from './components/screens/ProfileScreen';
import ChatScreen from './components/screens/ChatScreen';
import EditProfileScreen from './components/screens/EditProfileScreen';
import CreateGroupScreen from './components/screens/CreateGroupScreen';
import GroupChatScreen from './components/screens/GroupChatScreen';
import GroupMembersScreen from './components/screens/GroupMembersScreen';
import AdminScreen from './components/screens/AdminScreen';

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {/* Public */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/welcome" element={<OnboardScreen />} />

          {/* Authenticated app — trips are the core object */}
          <Route path="/trips" element={<RequireAuth><TripsListScreen /></RequireAuth>} />
          <Route path="/trips/new" element={<RequireAuth><AddTripScreen /></RequireAuth>} />
          <Route path="/trips/:id" element={<RequireAuth><TripHubScreen /></RequireAuth>} />
          <Route path="/trips/:tripId/groups/new" element={<RequireAuth><CreateGroupScreen /></RequireAuth>} />
          <Route path="/discover" element={<RequireAuth><DiscoverScreen /></RequireAuth>} />
          <Route path="/chats" element={<RequireAuth><ChatsScreen /></RequireAuth>} />
          <Route path="/me" element={<RequireAuth><EditProfileScreen /></RequireAuth>} />
          <Route path="/groups/new" element={<RequireAuth><CreateGroupScreen /></RequireAuth>} />
          <Route path="/groups/:id/chat" element={<RequireAuth><GroupChatScreen /></RequireAuth>} />
          <Route path="/groups/:id/members" element={<RequireAuth><GroupMembersScreen /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><AdminScreen /></RequireAuth>} />
          <Route path="/profile/:id" element={<RequireAuth><ProfileScreen /></RequireAuth>} />
          <Route path="/chat/:id" element={<RequireAuth><ChatScreen /></RequireAuth>} />

          {/* Legacy routes from the pre-trips app */}
          <Route path="/flight" element={<Navigate to="/trips/new" replace />} />
          <Route path="/feed" element={<Navigate to="/discover" replace />} />
          <Route path="/matches" element={<Navigate to="/chats" replace />} />
          <Route path="/groups" element={<Navigate to="/chats" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
