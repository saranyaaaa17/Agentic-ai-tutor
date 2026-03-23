import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
     return (
        <div className="min-h-screen bg-[#050B14] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
             <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
             <p className="text-slate-400 text-sm font-medium animate-pulse">Authenticating Access...</p>
          </div>
        </div>
     );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
