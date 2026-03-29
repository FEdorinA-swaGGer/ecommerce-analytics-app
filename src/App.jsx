import { Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'
import AdminPage from './pages/AdminPage'
import AdminLoginPage from './pages/AdminLoginPage'
import CatalogPage from './pages/CatalogPage'

function App() {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App
