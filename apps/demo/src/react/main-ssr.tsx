import { hydrateRoot } from 'react-dom/client'
import App from './App'
import './styles'

const rootElement = document.getElementById('app')
if (!rootElement)
  throw new Error('Root element #app was not found')

hydrateRoot(rootElement, <App ssr />)
