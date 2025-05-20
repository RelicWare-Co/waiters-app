import { Alert, Button, Container, Group, Loader, Paper, Text, Title, Stack, List, ThemeIcon, Badge, Accordion } from '@mantine/core'
import { IconAlertCircle, IconBellRinging, IconClipboardList, IconMessageCircle } from '@tabler/icons-react'
import { Link, createFileRoute, useParams } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '#/_generated/api';
import type { Doc, Id } from '#/_generated/dataModel';

export const Route = createFileRoute('/waiters/$waiterId')({
  component: WaiterDashboardComponent,
});

function WaiterDashboardComponent() {
  const params = useParams({ from: '/waiters/$waiterId' });
  const waiterId = (params as { waiterId: string }).waiterId as Id<'waiters'>;

  const waiter = useQuery(api.waiters.get, { id: waiterId });
  const openOrders = useQuery(api.orders.listOpenByWaiter, { waiterId });
  
  // Fetch announcements only when waiter data (and thus restaurantId) is available
  const restaurantId = waiter?.restaurantId;
  const announcements = useQuery(
    api.waiterNotes.listTodaysAnnouncements, 
    restaurantId ? { restaurantId } : 'skip'
  );

  if (waiter === undefined || openOrders === undefined) {
    return (
      <Container py="lg">
        <Group justify="center">
          <Loader />
        </Group>
      </Container>
    );
  }

  if (waiter === null) {
    return (
      <Container py="lg">
        <Alert icon={<IconAlertCircle size="1rem" />} title="Not Found" color="red">
          Waiter with ID "{waiterId}" not found.
        </Alert>
        <Group justify="center" mt="md">
          <Button component={Link} to="/"> {/* Redirect to a generic landing or login */}
            Go to Home
          </Button>
        </Group>
      </Container>
    );
  }

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'event': return <ThemeIcon color="grape"><IconBellRinging size={16} /></ThemeIcon>;
      case 'promotion': return <ThemeIcon color="teal"><IconBellRinging size={16} /></ThemeIcon>; // Consider different icon
      default: return <ThemeIcon color="blue"><IconBellRinging size={16} /></ThemeIcon>;
    }
  };

  return (
    <Container py="lg" fluid>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Welcome, {waiter.name}!</Title>
        {/* Placeholder for Chat button - B6 */}
        <Button 
          component={Link} 
          to={`/waiters/${waiterId}/chat`} // Example route, adjust as needed
          variant="outline" 
          leftSection={<IconMessageCircle size={16}/>}
        >
          Chat
        </Button>
      </Group>

      <Stack gap="xl">
        <Paper withBorder shadow="md" p="md" radius="md">
          <Title order={3} mb="md">Today's Announcements</Title>
          {announcements === undefined && restaurantId && <Loader size="sm" />}
          {announcements === undefined && !restaurantId && <Text c="dimmed" size="sm">Loading waiter details...</Text>}
          {announcements === null && restaurantId && (
            <Alert color="orange" icon={<IconAlertCircle/>}>Could not load announcements.</Alert>
          )}
          {announcements && announcements.length === 0 && <Text c="dimmed">No announcements for today.</Text>}
          {announcements && announcements.length > 0 && (
            <List spacing="xs" size="sm" center>
              {announcements.map((note: Doc<'waiter_notes'>) => (
                <List.Item key={note._id} icon={getAnnouncementIcon(note.type)}>
                  <Badge variant="light" color={note.type === 'event' ? 'grape' : note.type === 'promotion' ? 'teal' : 'blue'} mr="xs">
                    {note.type.toUpperCase()}
                  </Badge>
                  {note.content}
                </List.Item>
              ))}
            </List>
          )}
        </Paper>

        <Paper withBorder shadow="md" p="md" radius="md">
          <Title order={3} mb="md">Your Open Tables ({openOrders?.length || 0})</Title>
          {openOrders && openOrders.length > 0 ? (
            <Accordion defaultValue={openOrders[0]?._id}> 
              {openOrders.map((order: Doc<'orders'>) => (
                <Accordion.Item key={order._id} value={order._id}>
                  <Accordion.Control icon={<IconClipboardList size={20} />}>
                    Table: {order.tableNumber} (ID: {order._id.substring(order._id.length - 6)})
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text size="sm">Status: {order.status}</Text>
                    <Text size="sm">Total: ${order.total.toFixed(2)}</Text>
                    <Text size="sm">Created: {new Date(order._creationTime).toLocaleTimeString()}</Text>
                    <Group mt="sm">
                      <Button 
                        component={Link} 
                        to={`/waiters/${waiterId}/orders/${order._id}`} // B2: Detalle de Mesa
                        size="xs"
                      >
                        View Details
                      </Button>
                    </Group>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          ) : (
            <Text c="dimmed">No open tables assigned to you.</Text>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
