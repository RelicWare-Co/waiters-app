import { Alert, Button, Container, Grid, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core'
import { IconCreditCardOff, IconShoppingCartOff } from '@tabler/icons-react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '#/_generated/api'
import type { Id } from '#/_generated/dataModel'

export const Route = createFileRoute('/admin/dashboard')({
  component: AdminDashboardComponent,
})

interface DisplayAlert {
  id: Id<'products'> | Id<'payments'>;
  type: 'stock' | 'payment';
  message: string;
  icon: React.ReactNode;
  color: string;
  title: string;
}

function AdminDashboardComponent() {
  const restaurantId = 'kh78jmxj1pddtdzs8kd3c715ch7g8y6y' as Id<'restaurants'> // Placeholder

  const kpiData = useQuery(api.dashboard.getAdminDashboardKpis, { restaurantId })
  const alertData = useQuery(api.dashboard.getAdminDashboardAlerts, { restaurantId })

  if (kpiData === undefined || alertData === undefined) {
    return (
      <Container py="lg" fluid>
        <Group justify="center">
          <Loader />
        </Group>
      </Container>
    )
  }

  const { dailySales, countTodaysClosedOrders, openTablesCount } = kpiData
  const avgTicketPrice = countTodaysClosedOrders > 0 ? (dailySales / countTodaysClosedOrders).toFixed(2) : '0.00'

  const displayAlerts: DisplayAlert[] = []
  if (alertData) {
    for (const product of alertData.outOfStockProducts) {
      displayAlerts.push({
        id: product._id,
        type: 'stock',
        message: `Product "${product.name}" is marked as unavailable. Price: $${product.price.toFixed(2)}`,
        icon: <IconShoppingCartOff size="1rem" />,
        color: 'orange',
        title: 'Stock Alert'
      })
    }
    for (const payment of alertData.recentFailedPayments) {
      displayAlerts.push({
        id: payment._id,
        type: 'payment',
        message: `Payment of $${payment.amount.toFixed(2)} for order ID ${payment.orderId} failed.`,
        icon: <IconCreditCardOff size="1rem" />,
        color: 'red',
        title: 'Payment Alert'
      })
    }
  }

  return (
    <Container py="lg" fluid>
      <Title order={2} mb="xl">
        Admin Dashboard
      </Title>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md" radius="md">
            <Text size="xl" fw={700}>${dailySales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            <Text c="dimmed">Total Sales Today</Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md" radius="md">
            <Text size="xl" fw={700}>${avgTicketPrice}</Text>
            <Text c="dimmed">Average Ticket Price</Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md" radius="md">
            <Text size="xl" fw={700}>{openTablesCount}</Text>
            <Text c="dimmed">Open Tables</Text>
          </Paper>
        </Grid.Col>
      </Grid>

      <Title order={3} mt="xl" mb="md">
        Alerts
      </Title>
      {displayAlerts.length > 0 ? (
        <Stack>
          {displayAlerts.map((alert) => (
            <Paper key={alert.id} withBorder p="md" radius="md" shadow="xs">
              <Alert icon={alert.icon} title={alert.title} color={alert.color} variant="light">
                {alert.message}
              </Alert>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Text c="dimmed">No active alerts.</Text>
      )}

      <Title order={3} mt="xl" mb="md">
        Quick Access
      </Title>
      <Group mt="sm">
        <Button component={Link} to="/admin/products" variant='outline'>Manage Products (A2)</Button>
        {/* <Button component={Link} to="/admin/unavailable" variant='outline'>Daily Unavailable (A3)</Button> */}
        {/* <Button component={Link} to="/admin/payment-methods" variant='outline'>Payment Methods (A4)</Button> */}
        {/* <Button component={Link} to="/admin/schedule" variant='outline'>Restaurant Schedule (A5)</Button> */}
        {/* <Button component={Link} to="/admin/messages" variant='outline'>Messages to Waiters (A6)</Button> */}
        {/* <Button component={Link} to="/admin/reports" variant='outline'>Reports (A7)</Button> */}
      </Group>
    </Container>
  )
}
