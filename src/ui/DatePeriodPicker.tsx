import { useTranslation } from 'react-i18next';

import { DatePicker } from './DatePicker';
import type { InlineProps } from './Inline';
import { getInlineProps, Inline } from './Inline';
import { Label, LabelVariants } from './Label';
import { Stack } from './Stack';

type Props = InlineProps & {
  id: string;
  dateStart: Date;
  dateEnd: Date;
  minDate?: Date;
  onDateStartChange: (date: Date) => void;
  onDateEndChange: (date: Date) => void;
  disabled?: boolean;
};

const DatePeriodPicker = ({
  id,
  dateStart,
  dateEnd,
  minDate,
  onDateStartChange,
  onDateEndChange,
  disabled,
  ...props
}: Props) => {
  const { t } = useTranslation();

  const idPrefix = `${id}date-period-picker`;

  return (
    <Inline as="div" spacing={5} {...getInlineProps(props)}>
      <Stack spacing={2} as="div">
        <Label variant={LabelVariants.BOLD} htmlFor={`${idPrefix}-start`}>
          {t('date_period_picker.start')}
        </Label>
        <DatePicker
          id={`${idPrefix}-start`}
          selected={dateStart}
          minDate={minDate}
          onChange={(newDateStart) => {
            onDateStartChange(newDateStart);
            if (dateEnd.getTime() < newDateStart.getTime()) {
              onDateEndChange(newDateStart);
            }
          }}
          disabled={disabled}
        />
      </Stack>
      <Stack spacing={2} as="div">
        <Label variant={LabelVariants.BOLD} htmlFor={`${idPrefix}-end`}>
          {t('date_period_picker.end')}
        </Label>
        <DatePicker
          id={`${idPrefix}-end`}
          selected={dateEnd}
          onChange={(newDateEnd) => {
            onDateEndChange(newDateEnd);
            if (dateStart.getTime() > newDateEnd.getTime()) {
              onDateStartChange(newDateEnd);
            }
          }}
          minDate={dateStart}
          disabled={disabled}
        />
      </Stack>
    </Inline>
  );
};

export { DatePeriodPicker };
