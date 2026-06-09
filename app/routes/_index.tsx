<<<<<<< HEAD
import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  if (user) return redirect("/dashboard");
  return redirect("/auth/login");
}

export default function IndexPage() {
  return null;
=======
import { useConfigurables } from "~/modules/configurables";

export default function IndexPage() {
  const { config, loading } = useConfigurables();

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Base Template : {loading ? "Loading..." : config.appName ?? "Untitled App"}</h1>
      <p>Add your routes and pages here.</p>
    </div>
  );
>>>>>>> 7c6385e (chore(app-preview): inject skaffold + env configs)
}
