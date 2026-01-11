import Link from 'next/link'

import { authors } from '@/generated/content'

export default function AuthorsPage() {
  const authorList = Object.values(authors).sort((a, b) => a.id.localeCompare(b.id))

  return (
    <main>
      <h1>Authors</h1>
      <ul>
        {authorList.map((a) => (
          <li key={a.id}>
            <Link href={`/authors/${a.id}`}>{a.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
