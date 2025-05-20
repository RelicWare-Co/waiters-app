import { ActionIcon, Button, Container, Group, Loader, Switch, Table, Text, Title, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '#/_generated/api';
import type { Id } from '#/_generated/dataModel';

export const Route = createFileRoute('/admin/products/')({
  component: ProductListComponent,
});

function ProductListComponent() {
  const restaurantId = 'kh78jmxj1pddtdzs8kd3c715ch7g8y6y' as Id<'restaurants'>;
  const products = useQuery(api.products.listByRestaurant, { restaurantId });
  const setAvailability = useMutation(api.products.setAvailability);
  const deleteProductMutation = useMutation(api.products.deleteProduct);

  const handleToggleAvailability = async (productId: Id<'products'>, currentAvailability: boolean) => {
    try {
      await setAvailability({ id: productId, isAvailable: !currentAvailability });
      notifications.show({
        title: 'Success',
        message: `Product availability ${!currentAvailability ? 'enabled' : 'disabled'}.`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update product availability.',
        color: 'red',
      });
      console.error("Failed to toggle availability:", error);
    }
  };

  const handleDeleteProduct = async (productId: Id<'products'>, productName: string) => {
    // TODO: Add a confirmation modal here before deleting
    if (confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      try {
        await deleteProductMutation({ id: productId });
        notifications.show({
          title: 'Success',
          message: `Product "${productName}" deleted successfully.`,
          color: 'green',
        });
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to delete product.',
          color: 'red',
        });
        console.error("Failed to delete product:", error);
      }
    }
  };

  if (products === undefined) {
    return <Container py="lg"><Group justify="center"><Loader /></Group></Container>;
  }

  const rows = products.map((product) => (
    <Table.Tr key={product._id}>
      <Table.Td>{product.name}</Table.Td>
      <Table.Td style={{ maxWidth: 200 }}><Text truncate="end">{product.description || '-'}</Text></Table.Td>
      <Table.Td>${product.price.toFixed(2)}</Table.Td>
      <Table.Td>
        <Switch
          checked={product.isAvailable}
          onChange={() => handleToggleAvailability(product._id, product.isAvailable)}
          aria-label={`Toggle availability for ${product.name}`}
        />
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <Tooltip label="Edit Product">
            <ActionIcon component={Link} to={`/admin/products/${product._id}/edit`} variant="subtle" color="blue">
              <IconPencil size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete Product">
            <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteProduct(product._id, product.name)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container py="lg" fluid>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Product Management</Title>
        <Button component={Link} to="/admin/products/new" leftSection={<IconPlus size={16}/>}>
          Create New Product
        </Button>
      </Group>

      {products.length === 0 ? (
        <Text>No products found. Get started by creating one!</Text>
      ) : (
        <Table.ScrollContainer minWidth={700}>
          <Table striped highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Price</Table.Th>
                <Table.Th>Available</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Container>
  );
}
