import { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'

export default function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    // Fallback if rendered outside ThemeProvider
    return {
      theme: 'light',
      isDark: false,
      toggleTheme: () => {},
      setTheme: () => {}
    }
  }
  return context
}
