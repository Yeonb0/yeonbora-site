import { createRoot } from 'react-dom/client'
import { readManifest } from './manifest'

const M = readManifest()
createRoot(document.getElementById('app')!).render(
  <ul>
    {M.Viz.map((v) => (
      <li key={v.id}>{v.id}</li>
    ))}
  </ul>,
)
