import { addDays, differenceInDays, format, parse } from 'date-fns';
import { pick, set, setWith } from 'lodash';
import { useMemo } from 'react';

import { parseSpacing } from './Box';
import { Button, ButtonVariants } from './Button';
import { DatePeriodPicker } from './DatePeriodPicker';
import { Icon, Icons } from './Icon';
import type { InlineProps } from './Inline';
import { getInlineProps, Inline } from './Inline';
import { Input } from './Input';
import { Label } from './Label';
import { getStackProps, Stack } from './Stack';
import { Text } from './Text';

const formatTimeValue = (value: string) => {
  if (!value) {
    return null;
  }

  // is already in correct format
  if (/[0-2][0-4]h[0-5][0-9]m/.test(value)) {
    return value;
  }

  if (isNaN(value as any)) {
    return null;
  }

  let tranformedValue = value;

  // pad start with zero if 1 digit
  if (tranformedValue.length === 1) {
    tranformedValue = tranformedValue.padStart(2, '0');
  }

  // pad end with zeros if too short
  if (tranformedValue.length < 4) {
    tranformedValue = tranformedValue.padEnd(4, '0');
  }

  const firstChars = tranformedValue.substring(0, 2);
  const lastChars = tranformedValue.substring(2, 4);
  const firstDigits = parseInt(firstChars);
  const lastDigits = parseInt(lastChars);

  // check if first 2 numbers are above 0 and below or equal to 24
  if (firstDigits < 0 || firstDigits > 24) return null;

  // check if last 2 numbers are above 0 and below or equal to 59
  if (lastDigits < 0 || lastDigits > 59) return null;

  // transform into "h m" format
  return `${firstChars}h${lastChars}m`;
};

type RowProps = InlineProps & {
  data: Object;
  index: number;
  date: string;
  onEditCell: ({
    index,
    date,
    value,
  }: {
    index: number;
    date: string;
    value: string;
  }) => void;
};

const Row = ({ data, date, onEditCell, ...props }: RowProps) => {
  return [
    <Text key="dateLabel">{date}</Text>,
    ...Array.from({ length: 7 }, (_, i) => data?.[i]).map((value, index) => (
      <Input
        id={`${date}-${index}`}
        key={`${date}-${index}`}
        value={value ?? ''}
        onChange={(event) =>
          onEditCell({ index, date, value: event.target.value })
        }
        onBlur={(event) => {
          onEditCell({
            index,
            date,
            value: formatTimeValue(event.target.value),
          });
        }}
      />
    )),
    <Text key="dateLabel" />,
  ];
};

type HeaderProps = InlineProps & {
  header: string;
  index: number;
  onCopy: (index: number) => void;
};

const Header = ({ header, index, onCopy, ...props }: HeaderProps) => {
  return (
    <Inline
      as="div"
      justifyContent="space-between"
      paddingLeft={1}
      paddingRight={1}
      spacing={3}
      {...getInlineProps(props)}
    >
      <Label htmlFor={header}>{header}</Label>
      <Button
        variant={ButtonVariants.UNSTYLED}
        onClick={() => onCopy(index)}
        customChildren
      >
        <Icon name={Icons.COPY} />
      </Button>
    </Inline>
  );
};

type Props = {};

const updateCell = ({ originalData, date, index, value }) => {
  if (!value) return originalData;
  return setWith(originalData, `[${date}][${index}]`, value, Object);
};

const calculateDateRange = (
  dateStartString: string,
  dateEndString: string,
): string[] => {
  const dateStart = parseDate(dateStartString);
  const daysInBetween = differenceInDays(parseDate(dateEndString), dateStart);

  if (dateStartString === dateEndString) {
    return [dateStartString];
  }

  return [
    dateStartString,
    ...Array.from({ length: daysInBetween - 1 }, (_, i) =>
      formatDate(addDays(dateStart, i + 1)),
    ),
    dateEndString,
  ];
};

const parseDate = (dateString: string) =>
  parse(dateString, 'dd/MM/yyyy', new Date());
const formatDate = (date: Date) => format(date, 'dd/MM/yyyy');

const TimeTable = ({ id, className, onChange, value, ...props }: Props) => {
  const dateRange = useMemo(
    () => calculateDateRange(value.dateStart, value.dateEnd),
    [value.dateStart, value.dateEnd],
  );

  const handleChange = (toCleanValue) => {
    const range = calculateDateRange(
      toCleanValue.dateStart,
      toCleanValue.dateEnd,
    );

    console.log(JSON.stringify(toCleanValue, null, 2));

    // const cleanValue = {
    //   ...toCleanValue,
    //   // clean data that is not relevant for the range
    //   data: pick(toCleanValue.data, range),
    // };

    console.log(JSON.stringify(toCleanValue, null, 2));

    onChange(toCleanValue);
  };

  const handleDateStartChange = (date) => {
    handleChange({ ...value, dateStart: formatDate(date) });
  };

  const handleDateEndChange = (date) => {
    handleChange({ ...value, dateEnd: formatDate(date) });
  };

  const handleEditCell = ({ index, date, value: cellValue }) => {
    handleChange({
      ...value,
      data: updateCell({
        originalData: value.data ?? {},
        date,
        value: cellValue,
        index,
      }),
    });
  };

  return (
    <Stack
      as="div"
      spacing={4}
      className={className}
      alignItems="flex-start"
      {...getStackProps(props)}
    >
      <DatePeriodPicker
        id={id}
        dateStart={parseDate(value.dateStart)}
        dateEnd={parseDate(value.dateEnd)}
        onDateStartChange={handleDateStartChange}
        onDateEndChange={handleDateEndChange}
      />
      <Stack
        forwardedAs="div"
        css={`
          display: grid;
          grid-template-rows: repeat(${(dateRange?.length ?? 0) + 1}, 1fr);
          grid-template-columns:
            min-content repeat(7, 1fr)
            min-content;
          column-gap: ${parseSpacing(3)};
          row-gap: ${parseSpacing(3)};
          align-items: center;
        `}
      >
        {[
          <Text key="pre" />,
          ...Array.from({ length: 7 }, (_, i) => `t${i + 1}`).map(
            (header, headerIndex) => (
              <Header
                key={header}
                header={header}
                index={headerIndex}
                // onCopy={handleCopyColumn}
              />
            ),
          ),
          <Text key="post" />,
        ]}
        {dateRange.map((date) => (
          <Row
            date={date}
            data={value?.data?.[date]}
            onEditCell={handleEditCell}
          />
        ))}
      </Stack>
    </Stack>
  );
};

export { TimeTable };
