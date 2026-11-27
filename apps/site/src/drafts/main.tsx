import { createRoot } from 'react-dom/client'
import { App } from './App'
import './drafts.css'
import { readManifest } from './manifest'

createRoot(document.getElementById('app')!).render(<App manifest={readManifest()} />)
