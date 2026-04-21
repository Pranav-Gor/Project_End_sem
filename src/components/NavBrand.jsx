import { Link } from 'react-router-dom'
import { Gavel } from 'lucide-react'

export default function NavBrand() {
  return (
    <Link to="/" className="flex items-center gap-3 shrink-0 group">
      <span className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-widest uppercase transition-colors group-hover:text-auctus-teal dark:group-hover:text-auctus-cyan">
        Auctus.
      </span>
    </Link>
  )
}
