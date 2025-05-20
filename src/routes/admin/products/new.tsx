import { Alert, Button, Container, Group, NumberInput, Paper, Stack, Switch, TextInput, Textarea, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { api } from '#/_generated/api';
import type { Id } from '#/_generated/dataModel';

export const Route = createFileRoute('/admin/products/new')({
  component: CreateProductComponent,
});

interface ProductFormValues {
  name: string;
  description: string;
  price: number | ''; // Allow empty string for initial state, will parse to number
  isAvailable: boolean;
}

function CreateProductComponent() {
  const navigate = useNavigate();
  const restaurantId = 'kh78jmxj1pddtdzs8kd3c715ch7g8y6y' as Id<'restaurants'>; // Placeholder
  const createProduct = useMutation(api.products.create);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    initialValues: {
      name: '',
      description: '',
      price: '',
      isAvailable: true,
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Product name is required'),
      price: (value) => (value !== '' && value > 0 ? null : 'Price must be a positive number'),
    },
  });

  const handleSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createProduct({
        restaurantId,
        name: values.name,
        description: values.description || undefined, // Send undefined if empty for optional field
        price: Number(values.price), // Ensure price is a number
        isAvailable: values.isAvailable,
      });
      notifications.show({
        title: 'Success!',
        message: `Product "${values.name}" created successfully.`,
        color: 'green',
      });
      navigate({ to: '/admin/products' });
    } catch (error) {
      console.error("Failed to create product:", error);
      setSubmitError('Failed to create product. Please try again.');
      notifications.show({
        title: 'Error',
        message: 'Failed to create product.',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container py="lg" fluid>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Create New Product</Title>
        <Button component={Link} to="/admin/products/" variant="outline" leftSection={<IconArrowLeft size={16}/>}>
          Back to Product List
        </Button>
      </Group>

      <Paper withBorder shadow="md" p={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              withAsterisk
              label="Product Name"
              placeholder="e.g., Spaghetti Carbonara"
              {...form.getInputProps('name')}
            />
            <Textarea
              label="Description"
              placeholder="e.g., Creamy pasta with pancetta and pecorino cheese"
              {...form.getInputProps('description')}
              autosize
              minRows={2}
            />
            <NumberInput
              withAsterisk
              label="Price"
              placeholder="e.g., 12.99"
              min={0.01}
              step={0.01}
              decimalScale={2}
              {...form.getInputProps('price')}
            />
            <Switch
              label="Product is available by default"
              {...form.getInputProps('isAvailable', { type: 'checkbox' })}
            />

            {submitError && (
              <Alert title="Submission Error" color="red" withCloseButton onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}

            <Group justify="flex-end" mt="md">
              <Button 
                type="submit" 
                loading={isSubmitting}
                leftSection={<IconDeviceFloppy size={16}/>}
              >
                Save Product
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

// Need to import Link from @tanstack/react-router for the back button
// This is a comment to ensure the tool call includes the change for the Link component.
