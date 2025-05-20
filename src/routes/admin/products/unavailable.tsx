import { Alert, Button, Container, Group, Loader, Paper, Stack, Table, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconArrowLeft, IconMoodSad, IconRotateClockwise } from '@tabler/icons-react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { api } from '#/_generated/api';
import type { Doc, Id } from '#/_generated/dataModel';

export const Route = createFileRoute('/admin/products/unavailable')({
  component: UnavailableProductsComponent,
});

function UnavailableProductsComponent() {
  const restaurantId = 'kh78jmxj1pddtdzs8kd3c715ch7g8y6y' as Id<'restaurants'>; // Placeholder
  const unavailableProducts = useQuery(api.products.listUnavailableByRestaurant, { restaurantId });
  const setAllAvailable = useMutation(api.products.setAllAvailableByRestaurant);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetAll = async () => {
    setIsResetting(true);
    try {
      const result = await setAllAvailable({ restaurantId });
      notifications.show({
        title: 'Success!',
        message: `${result.updatedCount} product(s) marked as available.`,
        color: 'green',
      });
      // The list will auto-update due to Convex reactivity
    } catch (error) {
      console.error("Failed to reset products availability:", error);
      notifications.show({
        title: 'Error',
        message: 'Failed to mark products as available. Please try again.',
        color: 'red',
        icon: <IconAlertCircle />,
      });
    } finally {
      setIsResetting(false);
    }
  };

  const rows = unavailableProducts?.map((product: Doc<'products'>) => (
    <Table.Tr key={product._id}>
      <Table.Td>{product.name}</Table.Td>
      <Table.Td>{product.price.toFixed(2)}</Table.Td>
      {/* Placeholder for 'hora marcado' - would require schema change */}
      {/* <Table.Td>{product.markedUnavailableAt ? new Date(product.markedUnavailableAt).toLocaleString() : '-'}</Table.Td> */}
    </Table.Tr>
  ));

  return (
    <Container py="lg" fluid>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Daily Unavailable Products</Title>
        <Button component={Link} to="/admin/products/" variant="outline" leftSection={<IconArrowLeft size={16}/>}>
          Back to Product List
        </Button>
      </Group>

      {unavailableProducts === undefined && (
        <Group justify="center" py="xl"><Loader /></Group>
      )}

      {unavailableProducts && unavailableProducts.length === 0 && (
        <Paper withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
            <IconMoodSad size={48} stroke={1.5} style={{ marginBottom: '1rem' }} />
            <Title order={4} mb="xs">No Products Currently Unavailable</Title>
            <Text c="dimmed">All products are marked as available.</Text>
        </Paper>
      )}

      {unavailableProducts && unavailableProducts.length > 0 && (
        <Stack>
            <Paper withBorder shadow="sm" radius="md">
                <Table verticalSpacing="sm" striped highlightOnHover>
                <Table.Thead>
                    <Table.Tr>
                    <Table.Th>Product Name</Table.Th>
                    <Table.Th>Price</Table.Th>
                    {/* <Table.Th>Time Marked Unavailable</Table.Th> */}
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Paper>
            <Group justify="flex-end">
                <Button 
                    onClick={handleResetAll} 
                    loading={isResetting} 
                    leftSection={<IconRotateClockwise size={16}/>}
                    variant='filled'
                    color='teal'
                >
                    Mark All as Available
                </Button>
            </Group>
        </Stack>
      )}

      {unavailableProducts === null && (
         <Alert title="Error Loading Data" color="red" icon={<IconAlertCircle />}>
            There was an issue fetching the list of unavailable products. Please try refreshing the page.
        </Alert>
      )}
    </Container>
  );
}
