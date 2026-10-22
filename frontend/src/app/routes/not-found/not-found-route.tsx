import { Link } from "react-router-dom";
import Card from "@/components/ui/card/card";
import { paths } from "@/config/paths";

export default function NotFound() {
  return (
    <Card style={{ margin: "2rem auto", maxWidth: "560px", padding: "1.25rem" }}>
      <h2>Page not found</h2>
      <p style={{ marginTop: "0.5rem" }}>
        The requested page does not exist or has been moved.
      </p>
      <p style={{ marginTop: "0.75rem" }}>
        <Link to={paths.intake.getHref()}>Return to the intake</Link>
      </p>
    </Card>
  );
}
