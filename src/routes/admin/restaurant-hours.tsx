import { ActionIcon, Alert, Button, Container, Group, Loader, Paper, SimpleGrid, Stack, TextInput, Title, Tooltip } from '@mantine/core';
import { type UseFormReturnType, useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconClockHour4, IconCopy, IconDeviceFloppy } from '@tabler/icons-react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { useEffect, useState } from 'react';
import { api } from '#/_generated/api';
import type { Doc, Id } from '#/_generated/dataModel';

export const Route = createFileRoute('/admin/restaurant-hours')({
  component: RestaurantHoursComponent,
});

const DAYS_OF_WEEK = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

interface HourFormValues {
  open: string;
  close: string;
}

interface DayHoursProps {
  day: typeof DAYS_OF_WEEK[0];
  form: UseFormReturnType<HourFormValues>;
  onSave: (dayOfWeek: number, values: HourFormValues) => Promise<void>;
  onCopyToWeek: (dayOfWeek: number) => Promise<void>;
  isSaving: boolean;
  isCopying: boolean;
}

function DayHoursCard({ day, form, onSave, onCopyToWeek, isSaving, isCopying }: DayHoursProps) {
  const handleSubmit = () => {
    onSave(day.value, form.values);
  };

  return (
    <Paper withBorder shadow="sm" p="md" radius="md">
      <Stack>
        <Title order={4}>{day.label}</Title>
        <TextInput
          label="Open Time (HH:MM)"
          placeholder="e.g., 09:00"
          {...form.getInputProps('open')}
          leftSection={<IconClockHour4 size={16} />}
        />
        <TextInput
          label="Close Time (HH:MM)"
          placeholder="e.g., 22:00"
          {...form.getInputProps('close')}
          leftSection={<IconClockHour4 size={16} />}
        />
        <Group justify="flex-end">
          <Tooltip label="Copy these hours to all days">
            <ActionIcon 
              variant="outline" 
              onClick={() => onCopyToWeek(day.value)} 
              loading={isCopying} 
              disabled={isSaving || !form.values.open || !form.values.close} // Disable if no times to copy
              size="lg"
            >
              <IconCopy size={18} />
            </ActionIcon>
          </Tooltip>
          <Button 
            onClick={handleSubmit} 
            loading={isSaving}
            disabled={isCopying}
            leftSection={<IconDeviceFloppy size={16}/>}
          >
            Save
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

function RestaurantHoursComponent() {
  const restaurantId = 'kh78jmxj1pddtdzs8kd3c715ch7g8y6y' as Id<'restaurants'>; // Placeholder
  const hoursData = useQuery(api.restaurantHours.listByRestaurant, { restaurantId });
  const updateHoursMutation = useMutation(api.restaurantHours.updateHours);
  const copyHoursToWeekMutation = useMutation(api.restaurantHours.copyHoursToWeek);

  const [savingState, setSavingState] = useState<Record<number, boolean>>({}); // { dayValue: isLoading }
  const [copyingState, setCopyingState] = useState<Record<number, boolean>>({});

  // Initialize forms for each day
  const forms = DAYS_OF_WEEK.map(_day => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useForm<HourFormValues>({
      initialValues: { open: '', close: '' },
      validate: {
        open: (val, values) => ((val === '' && values.close === '') || /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(val) ? null : 'Invalid time format (HH:MM) or both must be empty/filled'),
        close: (val, values) => ((val === '' && values.open === '') || /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(val) ? null : 'Invalid time format (HH:MM) or both must be empty/filled'),
      }
    });
  });

  // Define a more specific type for items in hoursData, which can be a DB doc or a placeholder
  type RestaurantHourEntry = Doc<'restaurant_hours'> | 
    { restaurantId: Id<'restaurants'>, dayOfWeek: number, open: string, close: string, _id?: Id<'restaurant_hours'>, _creationTime?: number };

  useEffect(() => {
    if (hoursData) {
      for (const hourDoc of hoursData as RestaurantHourEntry[]) {
        if (hourDoc.dayOfWeek >= 0 && hourDoc.dayOfWeek < forms.length) {
          forms[hourDoc.dayOfWeek].setValues({ open: hourDoc.open, close: hourDoc.close });
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoursData, forms]); // forms array reference is stable

  const handleSave = async (dayOfWeek: number, values: HourFormValues) => {
    setSavingState(prev => ({ ...prev, [dayOfWeek]: true }));
    try {
      await updateHoursMutation({
        restaurantId,
        dayOfWeek,
        open: values.open,
        close: values.close,
      });
      notifications.show({ title: 'Success', message: `${DAYS_OF_WEEK[dayOfWeek].label} hours updated.`, color: 'green' });
    } catch (error) {
      console.error('Failed to update hours:', error);
      notifications.show({ title: 'Error', message: `Failed to update ${DAYS_OF_WEEK[dayOfWeek].label} hours.`, color: 'red', icon: <IconAlertCircle/> });
    } finally {
      setSavingState(prev => ({ ...prev, [dayOfWeek]: false }));
    }
  };

  const handleCopyToWeek = async (sourceDayOfWeek: number) => {
    setCopyingState(prev => ({ ...prev, [sourceDayOfWeek]: true }));
    try {
      const result = await copyHoursToWeekMutation({ restaurantId, sourceDayOfWeek });
      notifications.show({ title: 'Success', message: `Hours from ${DAYS_OF_WEEK[sourceDayOfWeek].label} copied to ${result.updatedCount} day(s).`, color: 'green' });
      // Data will refetch via Convex useQuery
    } catch (error) {
      console.error('Failed to copy hours:', error);
      notifications.show({ title: 'Error', message: 'Failed to copy hours.', color: 'red', icon: <IconAlertCircle/> });
    } finally {
      setCopyingState(prev => ({ ...prev, [sourceDayOfWeek]: false }));
    }
  };

  if (hoursData === undefined) {
    return <Container py="lg"><Group justify="center"><Loader /></Group></Container>;
  }
  if (hoursData === null) {
    return (
      <Container py="lg">
        <Alert title="Error" color="red" icon={<IconAlertCircle/>}>Could not load restaurant hours.</Alert>
      </Container>
    );
  }

  return (
    <Container py="lg" fluid>
      <Title order={2} mb="xl">Restaurant Opening Hours</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {DAYS_OF_WEEK.map((day, index) => (
          <DayHoursCard
            key={day.value}
            day={day}
            form={forms[index]}
            onSave={handleSave}
            onCopyToWeek={handleCopyToWeek}
            isSaving={savingState[day.value] || false}
            isCopying={copyingState[day.value] || false}
          />
        ))}
      </SimpleGrid>
    </Container>
  );
}
