import { Link } from 'react-router-dom'

import { worksRegistry } from '@works/registry'

export function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>个人作品集合</h1>
      <p>从 works registry 读取作品列表。</p>

      <ul style={{ paddingLeft: 18 }}>
        {worksRegistry.map((item) => (
          <li key={item.meta.id} style={{ marginBottom: 8 }}>
            <Link to={`/works/${item.meta.id}`}>{item.meta.title}</Link>
            {item.meta.description ? <div>{item.meta.description}</div> : null}
          </li>
        ))}
      </ul>
    </main>
  )
}
