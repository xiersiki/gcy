import { Link } from 'react-router-dom'

import type { WorkRegistryItem } from '@works/work.types'

export type WorkCardProps = {
  work: WorkRegistryItem
}

export default function WorkCard({ work }: WorkCardProps) {
  const { meta } = work

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      <Link to={`/works/${meta.id}`}>
        <div className="aspect-[4/3] overflow-hidden bg-gray-200">
          {meta.thumbnail ? (
            <img
              src={meta.thumbnail}
              alt={meta.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="bg-white text-gray-900 px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
              View Case Study
            </span>
          </div>
        </div>
      </Link>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            {meta.category ?? 'Work'}
          </span>
          <span className="text-xs text-gray-400 font-medium">{meta.date ?? ''}</span>
        </div>

        <Link to={`/works/${meta.id}`}>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
            {meta.title}
          </h3>
        </Link>

        {meta.description ? (
          <p className="text-gray-500 text-sm line-clamp-2 mb-4">{meta.description}</p>
        ) : null}

        {meta.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {meta.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-50 text-gray-500 text-[10px] rounded-md border border-gray-100"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
