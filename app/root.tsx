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
import { ConfigurablesProvider, ConfigurablesCSSBridge } from "~/modules/configurables";
import { AuthProvider } from "~/modules/authentication/use-authentication";
import { GlobalError } from "./error";

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
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

function RouteChangeReporter() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage(
        { type: "qb-route-change", pathname: location.pathname },
        "*",
      );
    }
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-background text-foreground min-h-screen">
        <RouteChangeReporter />
        <ConfigurablesProvider>
          <ConfigurablesCSSBridge />
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        </ConfigurablesProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
