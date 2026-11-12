import { Link, useNavigate, useParams } from "react-router-dom";
import Card from "@/components/ui/card/card";
import Loader from "@/components/ui/loader/loader";
import SpecialistForm from "@/features/specialists/specialist-form";
import { paths } from "@/config/paths";
import { toSpecialistForm, toSpecialistUpdate, type ISpecialistForm } from "@/schemas/specialist-schema";
import {
  useGetSpecialistOptionsQuery,
  useGetSpecialistQuery,
  useUpdateSpecialistMutation,
} from "@/store/specialists/specialist-api";
import styles from "@/app/routes/specialists/styles.module.css";

export default function SpecialistEditRoute() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const specialist = useGetSpecialistQuery(id);
  const options = useGetSpecialistOptionsQuery();
  const [updateSpecialist, { isLoading: isSaving }] = useUpdateSpecialistMutation();
  const backToList = () => navigate(paths.team.getHref());

  if (specialist.isLoading || options.isLoading) return <Loader label="Loading specialist…" />;
  if (!specialist.data || !options.data) {
    return (
      <Card className={styles.panel}>
        Could not load this specialist. <Link to={paths.team.getHref()}>Back to our team</Link>
      </Card>
    );
  }

  const save = async (form: ISpecialistForm) => {
    try {
      await updateSpecialist({ id, ...toSpecialistUpdate(form) }).unwrap();
      backToList();
    } catch {
      // api-client already shows the error as a toast; keep the form input.
    }
  };

  return (
    <>
      <title>{paths.specialistEdit.getDocTitle(specialist.data.name)}</title>
      <Card as="section" className={styles.panel} aria-labelledby="edit-specialist-title">
        <h2 id="edit-specialist-title" className={styles.title}>
          Edit {specialist.data.name}
        </h2>
        <SpecialistForm
          key={id}
          defaultValues={toSpecialistForm(specialist.data)}
          options={options.data}
          isSaving={isSaving}
          onSubmit={save}
          onCancel={backToList}
        />
      </Card>
    </>
  );
}
