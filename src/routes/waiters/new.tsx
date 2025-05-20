import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Container, Title, TextInput, Button, Group, Stack, LoadingOverlay } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'

export const Route = createFileRoute('/waiters/new')({
  component: NewWaiterComponent,
})

function NewWaiterComponent() {
  const navigate = useNavigate()
  const createWaiter = useMutation(api.waiters.create)
  const restaurantId = 'kh78jmxj1pddtdzs8kd3c715ch7g8y6y' as Id<'restaurants'>
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : 'Name is required'),
      email: (value) =>
        value.trim().length === 0 || /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)
          ? null
          : 'Invalid email address',
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true)
    try {
      await createWaiter({
        restaurantId,
        name: values.name,
        email: values.email || undefined,
      })
      notifications.show({
        title: 'Waiter Created',
        message: `Waiter ${values.name} has been successfully created.`,
        color: 'green',
      })
      navigate({ to: '/waiters' })
    } catch (error) {
      console.error('Failed to create waiter:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to create waiter. Please try again.',
        color: 'red',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container py="lg">
      <LoadingOverlay visible={isSubmitting} />
      <Title order={2} mb="md">
        Create New Waiter
      </Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            withAsterisk
            label="Name"
            placeholder="Enter waiter's name"
            {...form.getInputProps('name')}
          />
          <TextInput
            label="Email (Optional)"
            placeholder="Enter waiter's email"
            {...form.getInputProps('email')}
          />
          <Group justify="flex-end" mt="md">
            <Button type="submit" loading={isSubmitting}>
              Create Waiter
            </Button>
            <Button variant="default" onClick={() => navigate({ to: '/waiters' })} disabled={isSubmitting}>
              Cancel
            </Button>
          </Group>
        </Stack>
      </form>
    </Container>
  )
}
