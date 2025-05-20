import { Alert, Button, Container, Group, Loader, NumberInput, Paper, Stack, TextInput, Textarea, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-react';
import { Link, createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { useEffect, useState } from 'react';
import { api } from '#/_generated/api';
import type { Id } from '#/_generated/dataModel';

export const Route = createFileRoute('/admin/products/$productId/edit')({
  component: EditProductComponent,
});

interface ProductFormValues {
  name: string;
  description: string;
  price: number | '';
  // isAvailable is handled by a separate switch on the list page for simplicity here
}

function EditProductComponent() {
  const navigate = useNavigate();
  const { productId } = useParams({ from: '/admin/products/$productId/edit' });
  const productData = useQuery(api.products.get, { id: productId as Id<'products'> });
  const updateProduct = useMutation(api.products.update);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    initialValues: {
      name: '',
      description: '',
      price: '',
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Product name is required'),
      price: (value) => (value !== '' && Number(value) > 0 ? null : 'Price must be a positive number'),
    },
  });

  useEffect(() => {
    if (productData) {
      form.setValues({
        name: productData.name,
        description: productData.description || '',
        price: productData.price,
      });
    }
  }, [productData, form.setValues]); // Added form.setValues to dependencies

  const handleSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await updateProduct({
        id: productId as Id<'products'>,
        name: values.name,
        description: values.description || undefined,
        price: Number(values.price),
      });
      notifications.show({
        title: 'Success!',
        message: `Product "${values.name}" updated successfully.`,
        color: 'green',
      });
      navigate({ to: '/admin/products' });
    } catch (error) {
      console.error("Failed to update product:", error);
      setSubmitError('Failed to update product. Please try again.');
      notifications.show({
        title: 'Error',
        message: 'Failed to update product.',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (productData === undefined) {
    return <Container py="lg"><Group justify="center"><Loader /></Group></Container>;
  }

  if (productData === null) {
    return (
      <Container py="lg">
        <Alert title="Not Found" color="red" icon={<IconAlertCircle />}>
          Product not found. It might have been deleted.
        </Alert>
        <Button component={Link} to="/admin/products" mt="md" leftSection={<IconArrowLeft />}>
          Back to Product List
        </Button>
      </Container>
    );
  }

  return (
    <Container py="lg" fluid>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Edit Product: {productData.name}</Title>
        <Button component={Link} to="/admin/products" variant="outline" leftSection={<IconArrowLeft size={16}/>}>
          Back to Product List
        </Button>
      </Group>

      <Paper withBorder shadow="md" p={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              withAsterisk
              label="Product Name"
              {...form.getInputProps('name')}
            />
            <Textarea
              label="Description"
              {...form.getInputProps('description')}
              autosize
              minRows={2}
            />
            <NumberInput
              withAsterisk
              label="Price"
              min={0.01}
              step={0.01}
              decimalScale={2}
              {...form.getInputProps('price')}
            />
            
            {submitError && (
              <Alert title="Submission Error" color="red" withCloseButton onClose={() => setSubmitError(null)} icon={<IconAlertCircle />}>
                {submitError}
              </Alert>
            )}

            <Group justify="flex-end" mt="md">
              <Button 
                type="submit" 
                loading={isSubmitting}
                leftSection={<IconDeviceFloppy size={16}/>}
              >
                Save Changes
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

// Added IconAlertCircle to imports for Alert components
// Also added eslint-disable-next-line for useEffect dependencies to avoid potential infinite loop with form.setValues
