import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRoleHomePath } from "../utils/auth";

export default function RootRedirect() {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleHomePath(role)} replace />;
}
