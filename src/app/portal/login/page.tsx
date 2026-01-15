import { redirect } from 'next/navigation'

/**
 * Portal login page - redirects to unified /login page
 * Clients should select "I'm a Client" on the main login page
 */
export default function PortalLoginPage() {
    redirect('/login')
}
