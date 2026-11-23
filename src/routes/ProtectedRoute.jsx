import { Navigate } from "react-router-dom";

/**
 * `allow` is an optional predicate for routes that are not merely
 * logged-in-only. Gating in the sidebar alone is presentation, not a gate:
 * without this the page is one typed URL away for anybody. Both read the
 * SAME predicate, so the nav entry and the URL cannot disagree.
 *
 * A refused route goes to the dashboard rather than the login screen -- the
 * user IS signed in, they just may not read this page, and bouncing them to
 * /login reads as a session failure.
 */
const ProtectedRoute = ({ children, allow }) => {
  const token = localStorage.getItem("auth_token");

  // ❌ Not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Logged in, but not permitted to read this page
  if (typeof allow === "function" && !allow()) {
    return <Navigate to="/dashboard" replace />;
  }

  // ✅ Logged in
  return children;
};

export default ProtectedRoute;
