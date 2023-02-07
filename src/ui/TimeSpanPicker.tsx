import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { getInlineProps, Inline, InlineProps } from './Inline';
import { Label, LabelVariants } from './Label';
import { Stack } from './Stack';
import { getValueFromTheme } from './theme';
import { Typeahead } from './Typeahead';

const getValueForTimePicker = getValueFromTheme('timePicker');

const getHourOptions = () => {
  const hours = Array(24).fill(0);
  const minutes = Array(60).fill(0);
  const times = [];
  hours.forEach((_hour, i) => {
    minutes.forEach((_minute, minuteIndex) =>
      times.push(
        `${i > 9 ? i : `0${i}`}:${
          minuteIndex > 9 ? minuteIndex : `0${minuteIndex}`
        }`,
      ),
    );
  });

  return times;
};

const hourOptions = getHourOptions();

const quarterHours = ['00', '15', '30', '45'];

type Props = {
  id: string;
  startTimeLabel?: string;
  endTimeLabel?: string;
  startTime?: string;
  endTime?: string;
  onChangeStartTime: (newStartTime: string) => void;
  onChangeEndTime: (newEndTime: string) => void;
  disabled?: boolean;
} & InlineProps;

const isQuarterHour = (time: string) =>
  quarterHours.some((quarterHour) => time.endsWith(quarterHour));

const timeToNumeric = (time: string) => parseInt(time.replace(':', ''));

const filterStartTimes = (time: string, startTime: string, endTime: string) => {
  const timeValue = timeToNumeric(time);
  const isAfterStartTime = timeValue >= timeToNumeric(startTime);
  const isBeforeEndTime = timeValue < timeToNumeric(endTime);

  return isQuarterHour(time) && isBeforeEndTime && isAfterStartTime;
};

const filterEndTimes = (time: string, startTime: string) => {
  const isAfterStartTime = timeToNumeric(time) > timeToNumeric(startTime);

  return time === '23:59' || (isQuarterHour(time) && isAfterStartTime);
};

const dropDownCss = css`
  .rbt-menu.dropdown-menu.show {
    max-height: 140px !important;

    z-index: ${getValueForTimePicker('zIndexPopup')};

    .dropdown-item {
      padding: 0.25rem 0;
      text-align: center;
    }
  }
  .rbt-input-hint {
    display: none;
  }
`;

const TimeSpanPicker = ({
  id,
  startTime,
  endTime,
  startTimeLabel,
  endTimeLabel,
  onChangeStartTime,
  onChangeEndTime,
  disabled,
  ...props
}: Props) => {
  const { t } = useTranslation();
  const idPrefix = `${id}-time-span-picker`;

  return (
    <Inline as="div" spacing={5} {...getInlineProps(props)}>
      <Stack spacing={2} as="div">
        <Label variant={LabelVariants.BOLD} htmlFor={`${idPrefix}-start`}>
          {startTimeLabel ?? t('time_span_picker.start')}
        </Label>
        <Typeahead<string>
          inputType="time"
          inputRequired={true}
          name="startTime"
          id={`${idPrefix}-start`}
          customFilter={(time) => filterStartTimes(time, startTime, endTime)}
          defaultInputValue={startTime}
          options={hourOptions}
          labelKey={(option) => option}
          onBlur={(event) => onChangeStartTime(event.target.value)}
          onChange={([newValue]: string[]) => {
            if (!newValue) return;
            onChangeStartTime(newValue);
          }}
          positionFixed
          disabled={disabled}
          maxHeight="140px"
          css={dropDownCss}
        />
      </Stack>
      <Stack spacing={2} as="div">
        <Label variant={LabelVariants.BOLD} htmlFor={`${idPrefix}-end`}>
          {endTimeLabel ?? t('time_span_picker.end')}
        </Label>
        <Typeahead<string>
          inputType="time"
          inputRequired={true}
          name="endTime"
          id={`${idPrefix}-end`}
          customFilter={(time) => filterEndTimes(time, startTime)}
          defaultInputValue={endTime}
          options={hourOptions}
          labelKey={(option) => option}
          onBlur={(event) => onChangeEndTime(event.target.value)}
          onChange={([newValue]: string[]) => {
            if (!newValue) return;
            onChangeEndTime(newValue);
          }}
          css={dropDownCss}
          positionFixed
          disabled={disabled}
        />
      </Stack>
    </Inline>
  );
};

export { TimeSpanPicker };
