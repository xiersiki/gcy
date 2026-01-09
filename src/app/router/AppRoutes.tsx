import { lazy, Suspense } from 'react'
import type { ComponentType } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { HomePage } from '@app/views/home/HomePage'
import { worksRegistry } from '@works/registry'

const workRoutes = worksRegistry.map((item) => ({
  id: item.meta.id,
  Component: lazy(item.loader),
}))

function WorkRoute({ Component }: { Component: ComponentType }) {
  return (
    <Suspense fallback={null}>
      <Component />
    </Suspense>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      {workRoutes.map(({ id, Component }) => (
        <Route key={id} path={`/works/${id}`} element={<WorkRoute Component={Component} />} />
      ))}

      <Route path="/works" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
