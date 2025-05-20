import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Container, Title, Table, Button, Group, Text, Anchor, Loader } from '@mantine/core'

export const Route = createFileRoute('/waiters/')({
  component: RouteComponent,
})

function RouteComponent() {
  const restaurantId = 'kh78jmxj1pddtdzs8kd3c715ch7g8y6y' as Id<'restaurants'> // Use the provided restaurantId

  const waiters = useQuery(api.waiters.listByRestaurant, { restaurantId })

  if (waiters === undefined) {
    return (
      <Container py="lg">
        <Group justify="center">
          <Loader />
        </Group>
      </Container>
    )
  }

  const rows = waiters.map((waiter) => (
    <Table.Tr key={waiter._id}>
      <Table.Td>{waiter.name}</Table.Td>
      <Table.Td>{waiter.email || 'N/A'}</Table.Td>
      <Table.Td>
        <Anchor component={Link} to={`/waiters/${waiter._id}`}>
          View/Edit
        </Anchor>
      </Table.Td>
    </Table.Tr>
  ))

  return (
    <Container py="lg">
      <Group justify="space-between" mb="md">
        <Title order={2}>Waiters</Title>
        <Button component={Link} to="/waiters/new">
          Create New Waiter
        </Button>
      </Group>

      {waiters.length === 0 ? (
        <Text>No waiters found for this restaurant.</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      )}
    </Container>
  )
}
