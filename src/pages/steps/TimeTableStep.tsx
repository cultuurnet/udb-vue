import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { GeneralFormData, StepProps } from '@/pages/Steps';
import { Alert, AlertVariants } from '@/ui/Alert';
import { Box } from '@/ui/Box';
import type { StackProps } from '@/ui/Stack';
import { getStackProps, Stack } from '@/ui/Stack';
import {
  areAllTimeSlotsValid,
  isTimeTableEmpty,
  TimeTable,
} from '@/ui/TimeTable';

type TimeTableStepProps<TFormData extends GeneralFormData> = StackProps &
  StepProps<TFormData>;

const TimeTableStep = <TFormData extends GeneralFormData>({
  formState: { errors },
  control,
  className,
  field,
  onChange,
  ...props
}: TimeTableStepProps<TFormData>) => {
  const { t } = useTranslation();

  return (
    <Stack spacing={3} {...getStackProps(props)}>
      <Box>
        <Controller
          name={field}
          control={control}
          render={({ field }) => {
            return (
              <TimeTable
                id="timetable-movies"
                className={className}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);

                  if (isTimeTableEmpty(value) || areAllTimeSlotsValid(value)) {
                    onChange(value);
                  }
                }}
              />
            );
          }}
        />
      </Box>
      {errors?.timeTable && (
        <Alert visible variant={AlertVariants.DANGER} maxWidth="53rem">
          {t(
            `movies.create.validation_messages.timeTable.${errors.timeTable.type}`,
          )}
        </Alert>
      )}
    </Stack>
  );
};

export { TimeTableStep };
