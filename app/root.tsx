import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";
import type { LinksFunction } from "react-router";
import stylesheet from "~/tailwind.css?url";
import { useEffect } from "react";
<<<<<<< HEAD
import { ConfigurablesProvider, ConfigurablesCSSBridge } from "~/modules/configurables";
import { AuthProvider } from "~/modules/authentication/use-authentication";
=======
import { ThemeProvider } from "next-themes";
import { ConfigurablesProvider, ConfigurablesCSSBridge } from "~/modules/configurables";
>>>>>>> 7c6385e (chore(app-preview): inject skaffold + env configs)
import { GlobalError } from "./error";

export function ErrorBoundary() {
  const error = useRouteError();

  return (
<<<<<<< HEAD
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
=======
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
>>>>>>> 7c6385e (chore(app-preview): inject skaffold + env configs)
        <title>Oops! An Error Occurred</title>
        <Links />
      </head>
      <body>
        <GlobalError error={error} />
        <Scripts />
      </body>
    </html>
  );
}

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

<<<<<<< HEAD
=======
/**
 * RouteChangeReporter - Reports route changes to parent window via postMessage.
 * This enables the deck-app preview to detect when pages redirect to other routes.
 */
>>>>>>> 7c6385e (chore(app-preview): inject skaffold + env configs)
function RouteChangeReporter() {
  const location = useLocation();

  useEffect(() => {
<<<<<<< HEAD
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage(
        { type: "qb-route-change", pathname: location.pathname },
=======
    // Only send if we're in an iframe (embedded in deck-app preview)
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "qb-route-change",
          pathname: location.pathname,
        },
>>>>>>> 7c6385e (chore(app-preview): inject skaffold + env configs)
        "*",
      );
    }
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
<<<<<<< HEAD
    <html lang="en" className="dark">
=======
    <html lang="en">
>>>>>>> 7c6385e (chore(app-preview): inject skaffold + env configs)
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
<<<<<<< HEAD
      <body className="bg-background text-foreground min-h-screen">
        <RouteChangeReporter />
        <ConfigurablesProvider>
          <ConfigurablesCSSBridge />
          <AuthProvider>
            <Outlet />
          </AuthProvider>
=======
      <body>
        <RouteChangeReporter />
        <ConfigurablesProvider>
          <ConfigurablesCSSBridge />
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Outlet />
          </ThemeProvider>
>>>>>>> 7c6385e (chore(app-preview): inject skaffold + env configs)
        </ConfigurablesProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
