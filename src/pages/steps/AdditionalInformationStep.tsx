import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from 'react-query';

import {
  useAddEventMainImage,
  useAddImageToEvent,
  useAddVideoToEvent,
  useChangeDescription,
  useDeleteImageFromEvent,
  useGetEventById,
  useUpdateImageFromEvent,
} from '@/hooks/api/events';
import { useAddImage } from '@/hooks/api/images';
import { PictureDeleteModal } from '@/pages/steps/modals/PictureDeleteModal';
import type { FormData } from '@/pages/steps/modals/PictureUploadModal';
import { PictureUploadModal } from '@/pages/steps/modals/PictureUploadModal';
import type { Values } from '@/types/Values';
import { Alert } from '@/ui/Alert';
import { Box, parseSpacing } from '@/ui/Box';
import { Button, ButtonVariants } from '@/ui/Button';
import { FormElement } from '@/ui/FormElement';
import { Inline } from '@/ui/Inline';
import { ProgressBar, ProgressBarVariants } from '@/ui/ProgressBar';
import type { StackProps } from '@/ui/Stack';
import { getStackProps, Stack } from '@/ui/Stack';
import { Text, TextVariants } from '@/ui/Text';
import { TextArea } from '@/ui/TextArea';
import { parseOfferId } from '@/utils/parseOfferId';

import { AddVideoLinkModal } from '../AddVideoLinkModal';
import type { ImageType } from '../PictureUploadBox';
import { PictureUploadBox } from '../PictureUploadBox';
import type { Video, VideoEnriched } from '../VideoUploadBox';
import { VideoUploadBox } from '../VideoUploadBox';

const IDEAL_DESCRIPTION_LENGTH = 200;

type Field = 'description' | 'image' | 'video';

const AdditionalInformationStepVariant = {
  MINIMAL: 'minimal',
  EXTENDED: 'extended',
} as const;

type AdditionalInformationStepProps = StackProps & {
  eventId: string;
  onSuccess: (field: Field) => void;
  variant?: Values<typeof AdditionalInformationStepVariant>;
};

const AdditionalInformationStep = ({
  eventId,
  onSuccess,
  variant,
  ...props
}: AdditionalInformationStepProps) => {
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const [
    isPictureUploadModalVisible,
    setIsPictureUploadModalVisible,
  ] = useState(false);
  const [
    isPictureDeleteModalVisible,
    setIsPictureDeleteModalVisible,
  ] = useState(false);
  const [isAddVideoLinkModalVisible, setIsAddVideoLinkModalVisible] = useState(
    true,
  );

  const [description, setDescription] = useState('');
  const [imageToEditId, setImageToEditId] = useState('');
  const [imageToDeleteId, setImageToDeleteId] = useState('');

  const getEventByIdQuery = useGetEventById({ id: eventId });

  useEffect(() => {
    // @ts-expect-error
    if (!getEventByIdQuery.data?.description) return;
    // @ts-expect-error
    setDescription(getEventByIdQuery.data.description.nl);
    // @ts-expect-error
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getEventByIdQuery.data?.description]);

  const images = useMemo(() => {
    // @ts-expect-error
    const mediaObjects = getEventByIdQuery.data?.mediaObject ?? [];
    // @ts-expect-error
    const eventImage = getEventByIdQuery.data?.image;

    const parsedMediaObjects = mediaObjects.map((mediaObject) => ({
      parsedId: parseOfferId(mediaObject['@id']),
      isMain: mediaObject.contentUrl === eventImage,
      ...mediaObject,
    }));

    return [
      ...parsedMediaObjects.filter((mediaObject) => mediaObject.isMain),
      ...parsedMediaObjects.filter((mediaObject) => !mediaObject.isMain),
    ] as ImageType[];
  }, [
    // @ts-expect-error
    getEventByIdQuery.data,
  ]);

  const enrichVideos = async (video: Video[]) => {
    const getYoutubeThumbnailUrl = (videoUrl: string) => {
      return `https://i.ytimg.com/vi_webp/${
        videoUrl.split('v=')[1]
      }/maxresdefault.webp`;
    };

    const getVimeoThumbnailUrl = async (videoUrl: string) => {
      const urlParts = videoUrl.split('/');
      const videoId = videoUrl.endsWith('/')
        ? urlParts[urlParts.length - 2]
        : urlParts[urlParts.length - 1];

      const response = await fetch(
        `http://vimeo.com/api/v2/video/${videoId}.json`,
      );

      const data = await response.json();

      return data?.[0]?.thumbnail_small;
    };

    const convertAllVideoUrlsPromises = video.map(async ({ url, ...video }) => {
      const thumbnailUrl = url.includes('youtube')
        ? getYoutubeThumbnailUrl(url)
        : await getVimeoThumbnailUrl(url);

      const enrichedVideo: VideoEnriched = {
        ...video,
        url,
        thumbnailUrl,
      };

      return enrichedVideo;
    });

    const data = await Promise.all(convertAllVideoUrlsPromises);

    setVideos(data);
  };

  const [videos, setVideos] = useState([]);

  useEffect(() => {
    if (
      // @ts-expect-error
      !getEventByIdQuery.data?.videos ||
      // @ts-expect-error
      getEventByIdQuery.data.videos.length === 0
    ) {
      return;
    }
    // @ts-expect-error
    enrichVideos(getEventByIdQuery.data.videos as Video[]);
  }, [
    // @ts-expect-error
    getEventByIdQuery.data?.videos,
  ]);

  const eventTypeId = useMemo(() => {
    // @ts-expect-error
    return getEventByIdQuery.data?.terms?.find(
      (term) => term.domain === 'eventtype',
    )?.id;
  }, [
    // @ts-expect-error
    getEventByIdQuery.data,
  ]);

  const descriptionProgress = useMemo(() => {
    return (description.length / IDEAL_DESCRIPTION_LENGTH) * 100;
  }, [description]);

  const imageToEdit = useMemo(() => {
    const image = images.find((image) => image.parsedId === imageToEditId);

    if (!image) return null;

    const { file, ...imageWithoutFile } = image;

    return imageWithoutFile;
  }, [images, imageToEditId]);

  const invalidateEventQuery = async (field: Field) => {
    await queryClient.invalidateQueries(['events', { id: eventId }]);
    onSuccess(field);
  };

  const handleSuccessAddImage = ({ imageId }) =>
    addImageToEventMutation.mutate({ eventId, imageId });

  const changeDescriptionMutation = useChangeDescription({
    onSuccess: async () => {
      await invalidateEventQuery('description');
    },
  });

  const addImageMutation = useAddImage({
    onSuccess: handleSuccessAddImage,
  });

  const addImageToEventMutation = useAddImageToEvent({
    onSuccess: async () => {
      setIsPictureUploadModalVisible(false);
      await invalidateEventQuery('image');
    },
  });

  const addEventMainImageMutation = useAddEventMainImage({
    onSuccess: async () => {
      await invalidateEventQuery('image');
    },
  });

  const updateImageFromEventMutation = useUpdateImageFromEvent({
    onSuccess: async () => {
      setIsPictureUploadModalVisible(false);
      await invalidateEventQuery('image');
    },
  });

  const handleSuccessDeleteImage = invalidateEventQuery;

  const deleteImageFromEventMutation = useDeleteImageFromEvent({
    onSuccess: handleSuccessDeleteImage,
  });

  const addVideoToEventMutation = useAddVideoToEvent({
    onSuccess: async () => {
      setIsAddVideoLinkModalVisible(false);
      await invalidateEventQuery('video');
    },
  });

  const handleClickAddImage = () => {
    setImageToEditId(undefined);
    setIsPictureUploadModalVisible(true);
  };
  const handleCloseModal = () => setIsPictureUploadModalVisible(false);

  const handleClickEditImage = (imageId: string) => {
    setImageToEditId(imageId);
    setIsPictureUploadModalVisible(true);
  };

  const handleClickDeleteImage = (imageId: string) => {
    setImageToDeleteId(imageId);
    setIsPictureDeleteModalVisible(true);
  };

  const handleClickSetMainImage = (imageId: string) =>
    addEventMainImageMutation.mutate({ eventId, imageId });

  const handleConfirmDelete = (imageId: string) => {
    deleteImageFromEventMutation.mutate({ eventId, imageId });
    setIsPictureDeleteModalVisible(false);
  };

  const handleAddVideoLink = async (url: string) => {
    await addVideoToEventMutation.mutateAsync({
      eventId,
      url,
      language: i18n.language,
    });
  };

  const handleSubmitValid = async ({
    file,
    description,
    copyrightHolder,
  }: FormData) => {
    if (imageToEdit) {
      await updateImageFromEventMutation.mutateAsync({
        eventId,
        imageId: imageToEdit.parsedId,
        description,
        copyrightHolder,
      });

      return;
    }

    await addImageMutation.mutateAsync({
      description,
      copyrightHolder,
      file: file?.[0],
      language: i18n.language,
    });
  };

  const handleBlurDescription = () => {
    if (!description) return;

    changeDescriptionMutation.mutate({
      description,
      language: i18n.language,
      eventId,
    });
  };

  const handleClickClearDescription = () => {
    setDescription('');
    changeDescriptionMutation.mutate({
      description: '',
      language: i18n.language,
      eventId,
    });
  };

  const DescriptionInfo = (props: StackProps) => (
    <Stack spacing={3} {...getStackProps(props)}>
      {description.length < IDEAL_DESCRIPTION_LENGTH && (
        <ProgressBar
          variant={ProgressBarVariants.SUCCESS}
          progress={descriptionProgress}
        />
      )}
      <Text variant={TextVariants.MUTED}>
        {description.length < IDEAL_DESCRIPTION_LENGTH
          ? t(
              'create.additionalInformation.description.progress_info.not_complete',
              {
                idealLength: IDEAL_DESCRIPTION_LENGTH,
                count: IDEAL_DESCRIPTION_LENGTH - description.length,
              },
            )
          : t(
              'create.additionalInformation.description.progress_info.complete',
              {
                idealLength: IDEAL_DESCRIPTION_LENGTH,
              },
            )}
      </Text>
      <Button
        variant={ButtonVariants.LINK}
        onClick={handleClickClearDescription}
      >
        {t('create.additionalInformation.description.clear')}
      </Button>
      {eventTypeId && (
        <Alert>
          <Box
            forwardedAs="div"
            dangerouslySetInnerHTML={{
              __html: t(
                `create*additionalInformation*description*tips*${eventTypeId}`,
                {
                  keySeparator: '*',
                },
              ),
            }}
            css={`
              strong {
                font-weight: bold;
              }

              ul {
                list-style-type: disc;
                margin-bottom: ${parseSpacing(4)};

                li {
                  margin-left: ${parseSpacing(5)};
                }
              }
            `}
          />
        </Alert>
      )}
    </Stack>
  );

  return (
    <Box>
      <PictureUploadModal
        visible={isPictureUploadModalVisible}
        onClose={handleCloseModal}
        imageToEdit={imageToEdit}
        onSubmitValid={handleSubmitValid}
      />
      <PictureDeleteModal
        visible={isPictureDeleteModalVisible}
        onConfirm={() => handleConfirmDelete(imageToDeleteId)}
        onClose={() => setIsPictureDeleteModalVisible(false)}
      />
      <AddVideoLinkModal
        visible={isAddVideoLinkModalVisible}
        onConfirm={handleAddVideoLink}
        onClose={() => setIsAddVideoLinkModalVisible(false)}
      />
      <Inline
        spacing={6}
        alignItems={{ default: 'flex-start', m: 'normal' }}
        stackOn="m"
      >
        <Stack spacing={3} flex={1}>
          <FormElement
            id="create-description"
            label={t('create.additionalInformation.description.title')}
            Component={
              <TextArea
                rows={10}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleBlurDescription}
              />
            }
            info={<DescriptionInfo />}
          />
        </Stack>
        <Stack spacing={4} flex={1}>
          <PictureUploadBox
            images={images}
            onClickEditImage={handleClickEditImage}
            onClickDeleteImage={handleClickDeleteImage}
            onClickSetMainImage={handleClickSetMainImage}
            onClickAddImage={handleClickAddImage}
          />
          <VideoUploadBox
            videos={videos}
            onClickAddVideo={() => setIsAddVideoLinkModalVisible(true)}
            onClickDeleteVideo={(videoUrl) => console.log('delete: ', videoUrl)}
          />
        </Stack>
      </Inline>
    </Box>
  );
};

AdditionalInformationStep.defaultProps = {
  variant: AdditionalInformationStepVariant.EXTENDED,
};

export { AdditionalInformationStep, AdditionalInformationStepVariant };
