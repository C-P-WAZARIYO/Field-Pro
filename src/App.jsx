import React from 'react'
import ProjectRoute from './route/projectRoute.jsx'
import { BrowserRouter} from 'react-router-dom'
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ProjectRoute />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
  