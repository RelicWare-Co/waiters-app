import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/restaurants/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/restaurants/"!</div>
}
