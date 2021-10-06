import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import { Button } from '@/ui/Button';
import { Icon, Icons } from '@/ui/Icon';
import { Image } from '@/ui/Image';
import { Input } from '@/ui/Input';
import { InputWithLabel } from '@/ui/InputWithLabel';
import { Modal, ModalSizes, ModalVariants } from '@/ui/Modal';
import { Paragraph } from '@/ui/Paragraph';
import { Stack } from '@/ui/Stack';
import { Text, TextVariants } from '@/ui/Text';
import { getValueFromTheme } from '@/ui/theme';

type FormData = {
  description: string;
  copyrightHolder: string;
  file: FileList;
};

type PictureUploadModalProps = {
  visible: boolean;
  onClose: () => void;
  imageToEdit?: { description: string; copyrightHolder: string };
  onSubmitValid: (data: FormData) => void;
};

const MAX_FILE_SIZE = 5000000;

const getValue = getValueFromTheme('moviesCreatePage');

const PictureUploadModal = ({
  visible,
  onClose,
  imageToEdit,
  onSubmitValid,
}: PictureUploadModalProps) => {
  const { t } = useTranslation();
  const formComponent = useRef<HTMLFormElement>();

  const schema = yup
    .object()
    .shape({
      description: yup.string().required().max(250),
      copyrightHolder: yup.string().required(),
      ...(!imageToEdit && {
        file: yup
          .mixed()
          .test((fileList: FileList) => fileList?.[0]?.size < MAX_FILE_SIZE)
          .required(),
      }),
    })
    .required();

  const {
    watch,
    reset,
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const watchedFile = watch('file');
  const image = watchedFile?.[0];
  const imagePreviewUrl = image && URL.createObjectURL(image);

  useEffect(() => {
    reset(imageToEdit ?? {});
  }, [imageToEdit, reset]);

  const handleClickUpload = () => {
    document.getElementById('file').click();
  };

  return (
    <Modal
      title={t('movies.create.edit_modal.title')}
      visible={visible}
      variant={ModalVariants.QUESTION}
      onClose={onClose}
      confirmTitle={imageToEdit ? 'Aanpassen' : 'Uploaden'}
      cancelTitle="Annuleren"
      size={ModalSizes.MD}
      onConfirm={() => {
        formComponent.current.dispatchEvent(
          new Event('submit', { cancelable: true, bubbles: true }),
        );
      }}
      confirmButtonDisabled={Object.keys(errors).length > 0}
    >
      <Stack
        as="form"
        ref={formComponent}
        spacing={4}
        padding={4}
        onSubmit={handleSubmit(onSubmitValid, (data) =>
          console.log('INVALID', data),
        )}
      >
        {!imageToEdit && (
          <Stack
            flex={1}
            spacing={4}
            height={300}
            backgroundColor={getValue('pictureUploadBox.backgroundColor')}
            justifyContent="center"
            alignItems="center"
            css={`
              border: 1px solid ${getValue('pictureUploadBox.borderColor')};
            `}
            padding={4}
          >
            <Text fontWeight={700}>Selecteer je foto</Text>
            {imagePreviewUrl ? (
              <Stack spacing={2}>
                <Image
                  src={imagePreviewUrl}
                  alt="preview"
                  width="auto"
                  maxHeight="8rem"
                  objectFit="cover"
                />
                <Text>{image.name}</Text>
              </Stack>
            ) : (
              <Icon
                name={Icons.IMAGE}
                width="auto"
                height="8rem"
                color={getValue('pictureUploadBox.imageIconColor')}
              />
            )}
            <Stack spacing={2} alignItems="center">
              <Text>Sleep een bestand hierheen of</Text>
              <Input
                id="file"
                type="file"
                display="none"
                accept=".jpg,.jpeg,.gif,.png"
                {...register('file')}
              />
              <Button onClick={handleClickUpload}>Kies bestand</Button>
              <Text>{errors?.file?.message ?? ''}</Text>
            </Stack>
            <Text variant={TextVariants.MUTED} textAlign="center">
              De maximale grootte van je afbeelding is 5MB en heeft als type
              .jpeg, .gif of .png
            </Text>
          </Stack>
        )}
        <InputWithLabel
          id="description"
          label="Beschrijving"
          info="Maximum 250 karakters"
          required
          error={
            errors.description &&
            t(
              `movies.create.edit_modal.validation_messages.description.${errors.description.type}`,
            )
          }
          {...register('description')}
        />

        <InputWithLabel
          id="copyrightHolder"
          label="Copyright"
          required
          info={
            <Stack spacing={3}>
              <Paragraph>
                Vermeld de naam van de rechtenhoudende fotograaf. Vul alleen de
                naam van je eigen vereniging of organisatie in als je zelf de
                rechten bezit (minimum 2 karakters).
              </Paragraph>
              <Paragraph>
                Je staat op het punt (een) afbeelding(en) toe te voegen en
                openbaar te verspreiden. Je dient daartoe alle geldende auteurs-
                en portretrechten te respecteren, alsook alle andere
                toepasselijke wetgeving. Je kan daarvoor aansprakelijk worden
                gehouden, zoals vastgelegd in de algemene voorwaarden. Meer
                informatie over copyright
              </Paragraph>
            </Stack>
          }
          error={
            errors.copyrightHolder &&
            t(
              `movies.create.edit_modal.validation_messages.copyrightHolder.${errors.copyrightHolder.type}`,
            )
          }
          {...register('copyrightHolder')}
        />
        <Text>
          <Text color="red">*</Text> verplicht veld
        </Text>
      </Stack>
    </Modal>
  );
};

export { MAX_FILE_SIZE, PictureUploadModal };
export type { FormData };
