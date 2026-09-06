import { ShieldAlert } from 'lucide-react'

// A clear denial page for a direct URL a role isn't meant to reach — the
// real enforcement is RLS (this role's queries return nothing regardless),
// this just avoids a confusing broken-looking screen.
export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 gap-2">
      <ShieldAlert size={32} className="text-red-400" />
      <h2 className="font-heading font-semibold text-gray-700">Access denied</h2>
      <p className="text-sm text-gray-500 max-w-xs">Your account doesn't have permission to view this page.</p>
    </div>
  )
}
