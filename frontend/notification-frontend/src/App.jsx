import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import RootRedirect from "./pages/RootRedirect";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import AppLayout from "./layouts/AppLayout";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCampaigns from "./pages/admin/AdminCampaigns";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminCreateStaff from "./pages/admin/AdminCreateStaff";

import CreatorDashboard from "./pages/creator/CreatorDashboard";
import CreatorUsers from "./pages/creator/CreatorUsers";
import CreatorCampaigns from "./pages/creator/CreatorCampaigns";
import CreatorLogs from "./pages/creator/CreatorLogs";

import ViewerDashboard from "./pages/viewer/ViewerDashboard";
import ViewerCampaigns from "./pages/viewer/ViewerCampaigns";
import ViewerLogs from "./pages/viewer/ViewerLogs";

import AccountSettings from "./pages/AccountSettings";

import CampaignRecipients from "./pages/CampaignRecipients";

import UserDashboard from "./pages/user/UserDashboard";
import UserPreferences from "./pages/user/UserPreferences";
import UserProfile from "./pages/user/UserProfile";
import UserNotifications from "./pages/user/UserNotifications";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/account" element={<AccountSettings />} />

              <Route
                path="/admin"
                element={<ProtectedRoute allowedRoles={["admin"]} />}
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="campaigns" element={<AdminCampaigns />} />
                <Route path="campaigns/:campaignId/recipients" element={<CampaignRecipients />} />
                <Route path="logs" element={<AdminLogs />} />
                <Route path="create-staff" element={<AdminCreateStaff />} />
              </Route>

              <Route
                path="/creator"
                element={<ProtectedRoute allowedRoles={["creator"]} />}
              >
                <Route index element={<CreatorDashboard />} />
                <Route path="users" element={<CreatorUsers />} />
                <Route path="campaigns" element={<CreatorCampaigns />} />
                <Route path="campaigns/:campaignId/recipients" element={<CampaignRecipients />} />
                <Route path="logs" element={<CreatorLogs />} />
              </Route>

              <Route
                path="/viewer"
                element={<ProtectedRoute allowedRoles={["viewer"]} />}
              >
                <Route index element={<ViewerDashboard />} />
                <Route path="campaigns" element={<ViewerCampaigns />} />
                <Route path="campaigns/:campaignId/recipients" element={<CampaignRecipients />} />
                <Route path="logs" element={<ViewerLogs />} />
              </Route>

              <Route
                path="/app"
                element={<ProtectedRoute allowedRoles={["user"]} />}
              >
                <Route index element={<UserDashboard />} />
                <Route path="preferences" element={<UserPreferences />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="notifications" element={<UserNotifications />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
