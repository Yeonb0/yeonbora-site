import { createRoot } from 'react-dom/client'
import { App } from './App'
import './drafts.css'
import { readManifest } from './manifest'
import { Role } from '../viz/palette'

// 작업대 색도 프로젝트 팔레트에서 (drafts.css 는 이 변수만 쓴다)
const Root = document.documentElement.style
Root.setProperty('--accent', Role.primary)
Root.setProperty('--point', Role.point)
Root.setProperty('--navy', Role.navyText)

createRoot(document.getElementById('app')!).render(<App manifest={readManifest()} />)
