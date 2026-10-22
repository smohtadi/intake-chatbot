import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/ui/button/button";
import Card from "@/components/ui/card/card";
import Form from "@/components/ui/form/form";
import Loader from "@/components/ui/loader/loader";
import DemoBanner from "@/components/demo-banner/demo-banner";
import { paths } from "@/config/paths";
import { site } from "@/config/site";
import { loginSchema, type ILoginForm } from "@/schemas/auth-schema";
import { useLoginMutation } from "@/store/auth/auth-api";
import { useAuth } from "@/store/auth/use-auth";
import styles from "@/app/routes/login/styles.module.css";

const INVALID_CREDENTIALS = "Invalid username or password.";

export default function LoginRoute() {
  const { user, loading } = useAuth();
  const [login, { isLoading }] = useLoginMutation();
  const [loginError, setLoginError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<ILoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  // After login, /me is re-fetched and `user` appears, which redirects here.
  if (user) return <Navigate to={paths.intake.getHref()} replace />;
  if (loading) return <Loader />;

  const onSubmit = async (form: ILoginForm) => {
    setLoginError(null);
    try {
      await login(form).unwrap();
    } catch (error) {
      if ((error as { status?: number }).status === 401) setLoginError(INVALID_CREDENTIALS);
    }
  };

  return (
    <>
      <title>{paths.login.getDocTitle()}</title>
      <DemoBanner />
      <Card as="main" className={styles.card}>
        <h1 className={styles.title}>{site.name}</h1>
        <Form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Form.Field controlId="username" error={formState.errors.username?.message}>
            <Form.Label>Username</Form.Label>
            <Form.Input autoComplete="username" {...register("username")} />
          </Form.Field>
          <Form.Field controlId="password" error={formState.errors.password?.message}>
            <Form.Label>Password</Form.Label>
            <Form.Input type="password" autoComplete="current-password" {...register("password")} />
          </Form.Field>
          {loginError && (
            <p className={styles.error} role="alert">
              {loginError}
            </p>
          )}
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Sign in
          </Button>
        </Form>
      </Card>
    </>
  );
}
