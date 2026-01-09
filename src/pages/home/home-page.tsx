import { useState } from 'react'
import { worksRegistry } from '@works/registry'
import WorkCard from '@shared/ui/components/WorkCard'

const categories = ['All', 'Design System', 'Web App', 'Mobile Design', 'Branding', 'SaaS', 'Art']

export function HomePage() {
  const [activeCategory, setActiveCategory] = useState('All')

  const filteredWorks =
    activeCategory === 'All'
      ? worksRegistry
      : worksRegistry.filter((item) => item.meta.category === activeCategory)

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Selected <span className="text-blue-600">Works</span> Collection
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            I build digital products that combine aesthetic beauty with functional excellence.
            Explore my latest projects spanning UI/UX, full-stack development, and visual identity.
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="sticky top-[64px] z-40 bg-white/95 backdrop-blur-sm py-4 border-b border-gray-100 mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredWorks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredWorks.map((item) => (
              <WorkCard key={item.meta.id} work={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <h3 className="text-xl font-medium text-gray-400">
              No projects found in this category
            </h3>
            <button
              onClick={() => setActiveCategory('All')}
              className="mt-4 text-blue-600 font-semibold hover:underline"
            >
              Back to All Works
            </button>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center border-t border-gray-100 pt-12">
        <p className="text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} Alex Dev. Designed with precision and crafted with code.
        </p>
      </footer>
    </div>
  )
}
