import { Alert, Badge, Box, Button, Container, Divider, Group, Loader, Paper, SimpleGrid, Stack, Table, Text, Title, List } from '@mantine/core';
import { IconAlertCircle, IconArrowLeft, IconPlus, IconEdit, IconTrash, IconFileInvoice, IconDivide } from '@tabler/icons-react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation } from 'convex/react'; 
import { api } from '#/_generated/api';
import type { Id } from '#/_generated/dataModel'; 
import { notifications } from '@mantine/notifications';

export const Route = createFileRoute('/waiters/$waiterId/orders/$orderId')({
  component: OrderDetailComponent,
});

function OrderDetailComponent() {
  const { waiterId, orderId } = Route.useParams() as {
    waiterId: Id<'waiters'>;
    orderId: Id<'orders'>;
  };

  const orderDetails = useQuery(api.orders.details, { orderId });
  const updateOrderItemMutation = useMutation(api.orderItems.updateItem);
  const removeOrderItemMutation = useMutation(api.orderItems.removeItem);
  const addPaymentMutation = useMutation(api.payments.add);
  const closeOrderMutation = useMutation(api.orders.closeOrder);
  const addItemMutation = useMutation(api.orderItems.addItem);

  // Fetch available products - only if orderDetails and order are loaded
  const availableProducts = useQuery(
    api.products.listAvailable,
    orderDetails?.order ? { restaurantId: orderDetails.order.restaurantId } : 'skip'
  );

  if (orderDetails === undefined) {
    return <Container py="lg"><Group justify="center"><Loader /></Group></Container>;
  }

  if (orderDetails === null) {
    return (
      <Container py="lg">
        <Alert icon={<IconAlertCircle size="1rem" />} title="Order Not Found" color="red">
          Order with ID "{orderId}" not found.
        </Alert>
        <Group justify="center" mt="md">
          <Button component={Link} to={`/waiters/${waiterId}`}>
            Back to Dashboard
          </Button>
        </Group>
      </Container>
    );
  }

  const { order, items, payments } = orderDetails;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const paidAmount = payments.reduce((sum, payment) => payment.status === 'completed' ? sum + payment.amount : sum, 0);
  const amountDue = order.total - paidAmount;

  // Action Handlers
  const handleAddItem = async () => {
    if (!availableProducts || availableProducts.length === 0) {
      notifications.show({
        title: 'No Products Available',
        message: 'Cannot add items as no products are currently available or loaded.',
        color: 'yellow',
      });
      return;
    }

    const productName = prompt('Enter product name to add:');
    if (!productName) {
      notifications.show({ title: 'Add Item Cancelled', message: 'Product name not provided.', color: 'blue' });
      return;
    }

    const productToAdd = availableProducts.find(
      (p) => p.name.toLowerCase() === productName.toLowerCase()
    );

    if (!productToAdd) {
      notifications.show({
        title: 'Product Not Found',
        message: `Product "${productName}" not found or is not available.`,
        color: 'red',
      });
      return;
    }

    const quantityStr = prompt(`Enter quantity for ${productToAdd.name}:`, '1');
    if (quantityStr === null) {
      notifications.show({ title: 'Add Item Cancelled', message: 'Quantity not provided.', color: 'blue' });
      return;
    }
    const quantity = Number.parseInt(quantityStr, 10);

    if (Number.isNaN(quantity) || quantity <= 0) {
      notifications.show({ title: 'Invalid Quantity', message: 'Quantity must be a positive number.', color: 'red' });
      return;
    }

    const notes = prompt(`Enter any special notes for ${productToAdd.name} (optional):`, '');

    try {
      await addItemMutation({
        orderId: order._id,
        productId: productToAdd._id,
        quantity,
        notes: notes || undefined, // Pass undefined if notes is empty or null
      });
      notifications.show({
        title: 'Item Added',
        message: `${quantity} x ${productToAdd.name} added to order.`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({ title: 'Add Item Failed', message: (error as Error).message, color: 'red' });
    }
  };
  
  const handleChangeItem = async (itemId: Id<'order_items'>, currentQuantity: number, currentNotes?: string) => {
    const newQuantityStr = prompt(`Update quantity for item (current: ${currentQuantity}):`, String(currentQuantity));
    if (newQuantityStr === null) return; 
    const newQuantity = Number.parseInt(newQuantityStr, 10);

    if (Number.isNaN(newQuantity) || newQuantity < 0) {
      notifications.show({ title: 'Invalid Quantity', message: 'Quantity must be a non-negative number.', color: 'red' });
      return;
    }

    const newNotes = prompt(`Update notes for item (current: ${currentNotes || ''}):`, currentNotes || '');
    // if (newNotes === null) return; 

    try {
      await updateOrderItemMutation({
        orderItemId: itemId,
        quantity: newQuantity, 
        notes: newNotes === null ? undefined : newNotes, 
      });
      notifications.show({ title: 'Item Updated', message: 'Order item updated successfully.', color: 'green' });
    } catch (error) {
      notifications.show({ title: 'Update Failed', message: (error as Error).message, color: 'red' });
    }
  };

  const handleRemoveItem = async (itemId: Id<'order_items'>) => {
    if (!confirm('Are you sure you want to remove this item?')) return;
    try {
      await removeOrderItemMutation({ orderItemId: itemId });
      notifications.show({ title: 'Item Removed', message: 'Order item removed successfully.', color: 'green' });
    } catch (error) {
      notifications.show({ title: 'Removal Failed', message: (error as Error).message, color: 'red' });
    }
  };
  
  const handleDivideAccount = () => notifications.show({ message: 'Divide account (B4) coming soon!', color: 'blue' });
  
  const handleCloseTable = async () => {
    if (order.status !== 'open') {
      notifications.show({ title: 'Order Not Open', message: 'This order is not open and cannot be modified.', color: 'yellow' });
      return;
    }

    // Step 1: Add Payment
    const paymentMethod = prompt('Enter payment method (e.g., cash, card, qr):');
    if (!paymentMethod) {
      notifications.show({ title: 'Payment Cancelled', message: 'Payment method not provided.', color: 'blue' });
      return;
    }

    const paymentAmountStr = prompt(`Enter amount paid (amount due: $${amountDue.toFixed(2)}):`);
    if (paymentAmountStr === null) {
      notifications.show({ title: 'Payment Cancelled', message: 'Payment amount not provided.', color: 'blue' });
      return;
    }
    const paymentAmount = Number.parseFloat(paymentAmountStr);

    if (Number.isNaN(paymentAmount) || paymentAmount <= 0) {
      notifications.show({ title: 'Invalid Amount', message: 'Payment amount must be a positive number.', color: 'red' });
      return;
    }

    try {
      await addPaymentMutation({
        orderId: order._id,
        method: paymentMethod,
        amount: paymentAmount,
        status: 'completed', // Assume payment is completed for this flow
      });
      notifications.show({ title: 'Payment Added', message: `Payment of $${paymentAmount.toFixed(2)} via ${paymentMethod} recorded.`, color: 'green' });

      // Step 2: Attempt to Close Order (backend will verify if total paid is sufficient)
      // Give a brief moment for the optimistic update / query re-fetch to reflect new payment if possible
      // though direct check is better handled by backend.
      try {
        const closeResult = await closeOrderMutation({ orderId: order._id });
        if (closeResult.success) {
          notifications.show({ title: 'Order Closed', message: 'Order has been successfully closed.', color: 'green' });
        }
        // If closeResult doesn't have a success field or it's false but no error thrown,
        // it means the backend logic prevented closure (e.g. insufficient payment) and threw an error handled below.
      } catch (closeError) {
        notifications.show({ title: 'Closure Failed', message: (closeError as Error).message, color: 'red' });
      }

    } catch (paymentError) {
      notifications.show({ title: 'Payment Failed', message: (paymentError as Error).message, color: 'red' });
    }
  };

  return (
    <Container py="lg" fluid>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Order Details - Table {order.tableNumber}</Title>
        <Button component={Link} to={`/waiters/${waiterId}`} leftSection={<IconArrowLeft size={16}/>}>
          Back to Dashboard
        </Button>
      </Group>

      <Paper withBorder shadow="md" p="md" radius="md">
        <Stack gap="lg">
          <Box>
            <Title order={4} mb="sm">Current Items</Title>
            {items.length > 0 ? (
              <Table striped highlightOnHover withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Product</Table.Th>
                    <Table.Th>Quantity</Table.Th>
                    <Table.Th>Unit Price</Table.Th>
                    <Table.Th>Total</Table.Th>
                    <Table.Th>Notes</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {items.map((item) => (
                    <Table.Tr key={item._id}>
                      <Table.Td>{item.productName || item.productId}</Table.Td>
                      <Table.Td>{item.quantity}</Table.Td>
                      <Table.Td>${item.price.toFixed(2)}</Table.Td>
                      <Table.Td>${(item.price * item.quantity).toFixed(2)}</Table.Td>
                      <Table.Td>{item.notes || '-'}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Button size="xs" variant="outline" onClick={() => handleChangeItem(item._id, item.quantity, item.notes)} leftSection={<IconEdit size={14}/>}>Edit</Button>
                          <Button size="xs" variant="outline" color="red" onClick={() => handleRemoveItem(item._id)} leftSection={<IconTrash size={14}/>}>Del</Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c="dimmed">No items added to this order yet.</Text>
            )}
            <Button mt="md" onClick={handleAddItem} leftSection={<IconPlus size={16}/>}>
              Add Product
            </Button>
          </Box>

          <Divider />

          <Box>
            <Title order={4} mb="sm">Summary & Payment</Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Stack>
                <Text>Subtotal: ${subtotal.toFixed(2)}</Text>
                <Text>Tax (e.g. 10%): ${(subtotal * 0.10).toFixed(2)}</Text> 
                <Text fw={700}>Order Total: ${order.total.toFixed(2)}</Text>
              </Stack>
              <Stack>
                <Text>Status: <Badge color={order.status === 'open' ? 'blue' : order.status === 'closed' ? 'green' : 'gray'}>{order.status.toUpperCase()}</Badge></Text>
                <Text>Paid Amount: ${paidAmount.toFixed(2)}</Text>
                <Text fw={700} c={amountDue > 0 ? 'red' : 'green'}>
                  Amount Due: ${amountDue.toFixed(2)}
                </Text>
              </Stack>
            </SimpleGrid>

            <Title order={5} mt="lg" mb="sm">Payments Received:</Title>
            {payments.length > 0 ? (
               <List size="sm">
                {payments.map(p => (
                  <List.Item key={p._id}>{p.method}: ${p.amount.toFixed(2)} ({p.status}) - {new Date(p._creationTime).toLocaleTimeString()}</List.Item>
                ))}
              </List>
            ) : (
              <Text c="dimmed" size="sm">No payments recorded yet.</Text>
            )}
          </Box>

          <Divider />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={handleDivideAccount} leftSection={<IconDivide size={16}/>} disabled={order.status !== 'open'}>
              Divide Account (B4)
            </Button>
            <Button 
              color="green" 
              onClick={handleCloseTable} 
              leftSection={<IconFileInvoice size={16}/>} 
              disabled={order.status !== 'open'}
            >
              Finalize & Pay / Close Table (B5)
            </Button>
          </Group>

        </Stack>
      </Paper>
    </Container>
  );
}
