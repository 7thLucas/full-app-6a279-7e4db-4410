import { redirect } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUserFromRequest, signJwt, buildAuthCookie } from "~/modules/authentication/authentication.server";
import { AuthService } from "~/modules/authentication/authentication.service";
import { useConfigurables } from "~/modules/configurables";
import { useActionData, Form, Link } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  if (getUserFromRequest(request)) return redirect("/dashboard");
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  try {
    const user = await AuthService.login({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    const token = signJwt({ sub: user.id, role: user.role, username: user.username, email: user.email, email_verified: user.email_verified });
    return redirect("/dashboard", { headers: { "Set-Cookie": buildAuthCookie(token, new URL(request.url).hostname) } });
  } catch (error: any) {
    return { error: error.message ?? "Invalid credentials" };
  }
}

export default function LoginRoute() {
  const actionData = useActionData<typeof action>();
  const { config, loading } = useConfigurables();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080E1C] relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(to right, #2D3F5E 1px, transparent 1px), linear-gradient(to bottom, #2D3F5E 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#0F1629]">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor"/>
                <path d="M9 22V12h6v10" stroke="#0F1629" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-wide text-white">
              {loading ? "MyWare" : config.appName ?? "MyWare"}
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            {loading ? "" : config.tagline ?? "See your warehouse in three dimensions."}
          </p>
        </div>

        {/* Login Card */}
        <div
          className="bg-[#1A2340] border border-[#2D3F5E] rounded-xl p-8"
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}
        >
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>

          {actionData && "error" in actionData && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {actionData.error}
            </div>
          )}

          <Form method="post" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 bg-[#0F1629] border border-[#2D3F5E] rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-[#0F1629] border border-[#2D3F5E] rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0F1629] font-semibold rounded-lg transition-colors text-sm mt-2"
            >
              Sign In
            </button>
          </Form>

          <div className="mt-6 p-4 bg-[#0F1629] rounded-lg border border-[#2D3F5E]">
            <p className="text-xs text-slate-400 font-medium mb-2">Demo Accounts</p>
            <div className="space-y-1 text-xs text-slate-500">
              <div className="flex justify-between">
                <span className="text-amber-400">Manager:</span>
                <span className="font-mono">manager@myware.demo / Demo1234!</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-400">Employee:</span>
                <span className="font-mono">employee1@myware.demo / Demo1234!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
