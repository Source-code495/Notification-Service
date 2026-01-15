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
import AdminNewsletters from "./pages/admin/AdminNewsletters";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminCreateStaff from "./pages/admin/AdminCreateStaff";
import AdminOrders from "./pages/admin/AdminOrders";

import CreatorDashboard from "./pages/creator/CreatorDashboard";
import CreatorUsers from "./pages/creator/CreatorUsers";
import CreatorCampaigns from "./pages/creator/CreatorCampaigns";
import CreatorNewsletters from "./pages/creator/CreatorNewsletters";
import CreatorLogs from "./pages/creator/CreatorLogs";

import ViewerDashboard from "./pages/viewer/ViewerDashboard";
import ViewerCampaigns from "./pages/viewer/ViewerCampaigns";
import ViewerNewsletters from "./pages/viewer/ViewerNewsletters";
import ViewerLogs from "./pages/viewer/ViewerLogs";

import AccountSettings from "./pages/AccountSettings";

import CampaignRecipients from "./pages/CampaignRecipients";
import NewsletterRecipients from "./pages/shared/NewsletterRecipients";
import NewsletterArticlesPage from "./pages/shared/NewsletterArticlesPage";

import UserDashboard from "./pages/user/UserDashboard";
import UserPreferences from "./pages/user/UserPreferences";
import UserProfile from "./pages/user/UserProfile";
import UserNotifications from "./pages/user/UserNotifications";
import UserOrder from "./pages/user/UserOrder";
import MyOrders from "./pages/user/MyOrders";
import UserNewsletters from "./pages/user/UserNewsletters";

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
                <Route path="newsletters" element={<AdminNewsletters />} />
                <Route path="newsletters/:categoryId" element={<NewsletterArticlesPage basePath="/admin" />} />
                <Route path="newsletters/articles/:articleId/recipients" element={<NewsletterRecipients />} />
                <Route path="orders" element={<AdminOrders />} />
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
                <Route path="newsletters" element={<CreatorNewsletters />} />
                <Route path="newsletters/:categoryId" element={<NewsletterArticlesPage basePath="/creator" />} />
                <Route path="newsletters/articles/:articleId/recipients" element={<NewsletterRecipients />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="logs" element={<CreatorLogs />} />
              </Route>

              <Route
                path="/viewer"
                element={<ProtectedRoute allowedRoles={["viewer"]} />}
              >
                <Route index element={<ViewerDashboard />} />
                <Route path="campaigns" element={<ViewerCampaigns />} />
                <Route path="campaigns/:campaignId/recipients" element={<CampaignRecipients />} />
                <Route path="newsletters" element={<ViewerNewsletters />} />
                <Route path="newsletters/:categoryId" element={<NewsletterArticlesPage basePath="/viewer" readOnly />} />
                <Route path="newsletters/articles/:articleId/recipients" element={<NewsletterRecipients />} />
                <Route path="logs" element={<ViewerLogs />} />
              </Route>

              <Route
                path="/app"
                element={<ProtectedRoute allowedRoles={["user"]} />}
              >
                <Route index element={<UserDashboard />} />
                <Route path="newsletters" element={<UserNewsletters />} />
                <Route path="newsletters/:categoryId" element={<NewsletterArticlesPage basePath="/app" readOnly />} />
                <Route path="preferences" element={<UserPreferences />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="notifications" element={<UserNotifications />} />
                <Route path="order" element={<UserOrder />} />
                <Route path="orders" element={<MyOrders />} />
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
