import { HashRouter, Routes, Route } from 'react-router-dom'
import SetupPage from './pages/SetupPage'
import EditorPage from './pages/EditorPage'
import ExportPage from './pages/ExportPage'

function App(): React.JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SetupPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/export" element={<ExportPage />} />
      </Routes>
    </HashRouter>
  )
}

export default App
