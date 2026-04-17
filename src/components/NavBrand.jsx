import { Link } from 'react-router-dom'
import { Gavel } from 'lucide-react'

export default function NavBrand() {
  return (
    <Link to="/" className="flex items-center gap-3 shrink-0">
      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-auctus-teal to-auctus-cyan flex items-center justify-center shadow-lg shadow-auctus-teal/20">
        <Gavel className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
      </div>
      <span className="text-xl lg:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
        AUCTUS
      </span>
    </Link>
  )
}
