import { renderToString } from 'react-dom/server'
import App from './App'

export default () => renderToString(<App ssr />)
