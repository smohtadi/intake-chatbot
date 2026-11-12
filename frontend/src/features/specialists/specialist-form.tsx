import { useId } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/ui/button/button";
import Form from "@/components/ui/form/form";
import {
  specialistFormSchema,
  type IOption,
  type ISpecialistForm,
  type ISpecialistOptions,
} from "@/schemas/specialist-schema";
import styles from "@/features/specialists/styles.module.css";

const LINK_HINT = 'Use "#" for a placeholder link that does nothing.';

interface Props {
  defaultValues: ISpecialistForm;
  options: ISpecialistOptions;
  isSaving: boolean;
  onSubmit: (form: ISpecialistForm) => void;
  onCancel: () => void;
}

export default function SpecialistForm({ defaultValues, options, isSaving, onSubmit, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ISpecialistForm>({ resolver: zodResolver(specialistFormSchema), defaultValues });

  return (
    <Form onSubmit={handleSubmit(onSubmit)} noValidate preventEnterSubmit>
      <Form.Field controlId="name" error={errors.name?.message} required>
        <Form.Label>Name</Form.Label>
        <Form.Input autoComplete="off" {...register("name")} />
      </Form.Field>
      <Form.Field controlId="roleId" error={errors.roleId?.message} required>
        <Form.Label>Role</Form.Label>
        <Form.Select {...register("roleId")}>
          {options.roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </Form.Select>
      </Form.Field>
      <Form.Field controlId="description" error={errors.description?.message} required>
        <Form.Label>Description</Form.Label>
        <Form.TextArea rows={5} {...register("description")} />
      </Form.Field>
      <OptionGroup
        legend="Session format"
        options={options.sessionFormats}
        registration={register("sessionFormatIds")}
        error={errors.sessionFormatIds?.message}
      />
      <OptionGroup
        legend="Areas of practice"
        options={options.areasPractice}
        registration={register("areasPracticeIds")}
        error={errors.areasPracticeIds?.message}
      />
      <OptionGroup
        legend="Credentials"
        options={options.credentials}
        registration={register("credentialIds")}
        error={errors.credentialIds?.message}
      />
      <Form.Field controlId="bookingUrl" error={errors.bookingUrl?.message} hint={LINK_HINT} required>
        <Form.Label>Booking URL</Form.Label>
        <Form.Input autoComplete="off" {...register("bookingUrl")} />
      </Form.Field>
      <Form.Field controlId="profileUrl" error={errors.profileUrl?.message} hint={LINK_HINT} required>
        <Form.Label>Shareable profile URL</Form.Label>
        <Form.Input autoComplete="off" {...register("profileUrl")} />
      </Form.Field>
      <Form.Field controlId="photoUrl" error={errors.photoUrl?.message} hint="Leave empty to show initials.">
        <Form.Label>Photo URL</Form.Label>
        <Form.Input type="url" autoComplete="off" {...register("photoUrl")} />
      </Form.Field>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSaving}>
          Save
        </Button>
      </div>
    </Form>
  );
}

interface OptionGroupProps {
  legend: string;
  options: IOption[];
  registration: UseFormRegisterReturn;
  error?: string;
}

function OptionGroup({ legend, options, registration, error }: OptionGroupProps) {
  const errorId = useId();
  return (
    <fieldset className={styles.group} aria-describedby={error ? errorId : undefined} aria-invalid={error ? true : undefined}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <Form.Checkbox key={option.id} label={option.name} value={option.id} {...registration} />
        ))}
      </div>
      {error && (
        <span id={errorId} className={styles.error}>
          {error}
        </span>
      )}
    </fieldset>
  );
}
