import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminApp from './admin/AdminApp.jsx'

// No customer-facing link points here on purpose — the owner navigates to
// /admin directly. Plain pathname check instead of a router since this is
// the only second "route" the site has.
const isAdminRoute = window.location.pathname.startsWith('/admin')

createRoot(document.getElementById('root')).render(
  <StrictMode>{isAdminRoute ? <AdminApp /> : <App />}</StrictMode>,
)
