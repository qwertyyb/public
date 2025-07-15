const setDarkMode = (darkMode: boolean) => {
  if (darkMode) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const match = window.matchMedia('(prefers-color-scheme: dark)')
setDarkMode(match.matches)

match.addEventListener('change', (e) => {
  setDarkMode(e.matches)
})