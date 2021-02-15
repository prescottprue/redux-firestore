import { createContext } from 'react'

const ThemeContext = createContext({
  isDarkMode: false,
  toggleDarkMode: () => {}
})

export default ThemeContext
