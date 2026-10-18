import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import AppShell from './components/AppShell'
import { Spinner } from './components/Feedback'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import ProjectPage from './pages/ProjectPage'
import { ProjectsProvider } from './projects'

/** Only lets signed-in people through; everyone else is sent to /login. */
function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner label="Signing you in" />
  if (!user) return <Navigate to="/login" replace />
  return (
    <ProjectsProvider>
      <AppShell />
    </ProjectsProvider>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route element={<RequireAuth />}>
        <Route index element={<DashboardPage />} />
        <Route path="projects/:projectId" element={<ProjectPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
