import Card from "@/components/ui/card/card";

// Default ProtectedRoute fallback. Replace via the `fallback` prop once the
// project has a sign-in flow.
export default function NotSignedIn() {
  return (
    <Card style={{ margin: "2rem auto", maxWidth: "560px", padding: "1.25rem" }}>
      <h2>Not signed in</h2>
      <p style={{ marginTop: "0.5rem" }}>
        Your session has ended or you have not signed in yet.
      </p>
    </Card>
  );
}
