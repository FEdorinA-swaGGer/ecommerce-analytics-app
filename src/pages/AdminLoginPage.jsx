import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginAdmin } from '../utils/auth'
import styles from './AdminLoginPage.module.css'

function AdminLoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const ok = loginAdmin(form)
    if (!ok) {
      setError('Неверный логин или пароль')
      return
    }
    navigate('/admin')
  }

  return (
    <main className={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1>Вход в админку</h1>
        <p className={styles.note}>
          Демо-авторизация: admin / password (не для продакшена).
        </p>
        {error && <p className={styles.error}>{error}</p>}
        <input
          name="login"
          placeholder="Логин"
          value={form.login}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, login: event.target.value }))
          }
        />
        <input
          type="password"
          name="password"
          placeholder="Пароль"
          value={form.password}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, password: event.target.value }))
          }
        />
        <button type="submit">Войти</button>
      </form>
    </main>
  )
}

export default AdminLoginPage
