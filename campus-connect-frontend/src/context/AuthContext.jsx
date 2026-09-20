/**
 * AuthContext — global authentication state for the entire React app.
 *
 * HOW REACT CONTEXT WORKS:
 * Context is React's way to share data across components without prop drilling.
 * Instead of passing `user` through 10 levels of parent→child components,
 * any component can directly access the auth state.
 *
 * THE AUTH FLOW:
 * 1. App loads → AuthProvider checks localStorage for a saved token
 * 2. If token exists → calls /api/auth/me to get user profile → sets user state
 * 3. If no token → user state stays null → user sees login page
 * 4. On login → saves token to localStorage → sets user state → redirects to dashboard
 * 5. On logout → clears localStorage → clears user state → redirects to login
 *
 * WHY localStorage?
 * When the user refreshes the page, React state is lost (it's in memory).
 * localStorage persists across refreshes, so the user stays logged in.
 * The JWT token in localStorage is sent with every API request via the Axios interceptor.
 */
import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../api/authApi';

// 1. Create the context (like a "global variable container")
const AuthContext = createContext(null);

/**
 * AuthProvider wraps the entire app and provides auth state to all children.
 * Usage in main.jsx: <AuthProvider><App /></AuthProvider>
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Current user object or null
  const [loading, setLoading] = useState(true);  // True while checking auth on page load

  /**
   * useEffect runs ONCE when the app first loads.
   * It checks: "Is there a saved token? If so, is it still valid?"
   */
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          // Verify the token is still valid by calling /api/auth/me
          const response = await getCurrentUser();
          setUser(response.data.data); // response.data = ApiResponse, .data = UserResponse
        } catch (error) {
          // Token is invalid or expired — clear storage and reset state safely
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }

      setLoading(false); // Done checking, show the app
    };

    checkAuth();
  }, []); // Empty dependency array = run only once on mount

  /**
   * Login: save token and user data, update state.
   * Called from LoginPage after successful API response.
   */
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  /**
   * Logout: clear everything and reset state.
   * Called from Sidebar logout button.
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // The value object is what all child components can access
  const value = {
    user,       // The current user object (or null if not logged in)
    loading,    // True while initial auth check is in progress
    login,      // Function to log in
    logout,     // Function to log out
    isAuthenticated: !!user, // Boolean shorthand: true if user is not null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access auth context from any component.
 * Usage: const { user, login, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
