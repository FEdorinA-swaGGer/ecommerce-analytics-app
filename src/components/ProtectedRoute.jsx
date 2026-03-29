import { Navigate } from 'react-router-dom'
import { isAdminAuthenticated } from '../utils/auth'

function ProtectedRoute({ children }) {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />
  }
  return children
}

export default ProtectedRoute
