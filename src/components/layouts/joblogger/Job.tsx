import { Box } from '@/ui/Box';
import { Icon, Icons } from '@/ui/Icon';
import { List } from '@/ui/List';
import { formatDistance } from 'date-fns';
import { nlBE, fr } from 'date-fns/locale';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Inline } from '@/ui/Inline';
import { Stack } from '@/ui/Stack';
import { Button, ButtonVariants } from '@/ui/Button';
import { getValueFromTheme } from '@/ui/theme';
import { Link, LinkVariants } from '@/ui/Link';
import type { Values } from '@/types/Values';

const getValue = getValueFromTheme('jobStatusIcon');

const dateFnsLocales = { nl: nlBE, fr };

const JobTypes = {
  EXPORT: 'export',
  LABEL_BATCH: 'label_batch',
  LABEL_QUERY: 'label_query',
};

const JobStates = {
  CREATED: 'created',
  FINISHED: 'finished',
  FAILED: 'failed',
  STARTED: 'started',
} as const;

type StatusIconProps = {
  state: Values<typeof JobStates>;
};

const StatusIcon = memo(({ state }: StatusIconProps) => {
  if (state === JobStates.FINISHED) {
    return (
      <Icon
        name={Icons.CHECK_CIRCLE}
        color={getValue('complete.circleFillColor')}
      />
    );
  }
  return (
    <Icon
      name={Icons.CHECK_NOTCH}
      color={getValue('busy.spinnerStrokeColor')}
      css={`
        @keyframes rotation {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(359deg);
          }
        }
        .svg-inline--fa {
          animation: rotation 1s infinite linear;
        }
      `}
    />
  );
});

type Messages = {
  [K in Values<typeof JobStates>]?: string;
};

type JobProps = {
  createdAt: Date;
  finishedAt: Date;
  state: Values<typeof JobStates>;
  messages: Messages;
  exportUrl: string;
  onClick: () => void;
};

const Job = ({
  createdAt,
  finishedAt,
  state,
  messages,
  exportUrl,
  onClick,
}: JobProps) => {
  const { t, i18n } = useTranslation();

  const isDone = ([JobStates.FINISHED, JobStates.FAILED] as string[]).includes(
    state,
  );

  const timeAgo = useMemo(
    () =>
      formatDistance(isDone ? finishedAt : createdAt, new Date(), {
        locale: dateFnsLocales[i18n.language],
      }),
    [createdAt, finishedAt],
  );

  return (
    <List.Item paddingTop={3}>
      <Stack as="div" spacing={3} flex={1}>
        <Inline as="div" flex={1} justifyContent="space-between">
          <Stack>
            <Inline forwardedAs="div" spacing={2} css="word-break: break-word;">
              <Box as="span">{t('jobs.time_ago', { time: timeAgo })}</Box>
              {state !== JobStates.FAILED && <StatusIcon state={state} />}
            </Inline>
            <Box forwardedAs="p" css="word-break: break-word;">
              {messages?.[state] ?? ''}
            </Box>
          </Stack>
          <Button onClick={onClick} variant={ButtonVariants.UNSTYLED}>
            <Icon name={Icons.TIMES} alignItems="center" />
          </Button>
        </Inline>
        {!!exportUrl && (
          <Link href={exportUrl} variant={LinkVariants.BUTTON_SECONDARY}>
            {t('jobs.download')}
          </Link>
        )}
      </Stack>
    </List.Item>
  );
};

export { Job, JobStates, JobTypes };
