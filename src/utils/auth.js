const AUTH_KEY = 'is_admin_logged_in'

export const isAdminAuthenticated = () =>
  localStorage.getItem(AUTH_KEY) === 'true'

export const loginAdmin = ({ login, password }) => {
  const isValid = login === 'admin' && password === 'password'
  if (isValid) {
    localStorage.setItem(AUTH_KEY, 'true')
  }
  return isValid
}

export const logoutAdmin = () => {
  localStorage.removeItem(AUTH_KEY)
}
