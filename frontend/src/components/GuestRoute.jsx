import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function GuestRoute() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return token ? <Navigate to="/admin" replace /> : <Outlet />;
}

export default GuestRoute;
