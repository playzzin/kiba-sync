import { DashboardUiOverrides } from "@/components/dashboard-ui-overrides";
import { SiteModeShell } from "@/components/site-mode-shell";

export default function Home() {
  return (
    <>
      <DashboardUiOverrides />
      <SiteModeShell />
    </>
  );
}
