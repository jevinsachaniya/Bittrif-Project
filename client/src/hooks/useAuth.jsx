import { createContext, useContext, useState } from 'react'
import axios from 'axios'
import { API } from '../lib/utils'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bittrif_user') || 'null') } catch { return null }
  })

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password })
    setUser(data)
    localStorage.setItem('bittrif_user', JSON.stringify(data))
    return data
  }

  const register = async (name, email, phone, password) => {
    const { data } = await axios.post(`${API}/auth/register`, { name, email, phone, password })
    setUser(data)
    localStorage.setItem('bittrif_user', JSON.stringify(data))
    return data
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('bittrif_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
