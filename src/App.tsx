import { useEffect, useState } from "react";
import { FarmDashboard } from "@/components/FarmDashboard";
import { LandingPage } from "@/components/LandingPage";
import { useLandingFarmSummaries } from "@/hooks/useLandingFarmSummaries";
import { Navbar } from "@/components/Navbar";
import { FarmProvider } from "@/lib/farm-context";
import { farmConfigs, farmList, type FarmSlug } from "@/lib/farms";

const HOME_ROUTE = "/";
const FARM_ROUTES = farmList.map((farm) => farm.route);

function normalizePath(pathname: string) {
  const normalizedPathname = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  if (normalizedPathname === HOME_ROUTE || FARM_ROUTES.includes(normalizedPathname)) {
    return normalizedPathname;
  }

  return HOME_ROUTE;
}

function getFarmSlugFromPath(pathname: string): FarmSlug | null {
  const matchedFarm = farmList.find((farm) => farm.route === pathname);
  return matchedFarm?.slug ?? null;
}

export default function App() {
  const [pathname, setPathname] = useState(() => normalizePath(window.location.pathname));
  const landingFarmSummaries = useLandingFarmSummaries(farmList);

  useEffect(() => {
    const farmSlug = getFarmSlugFromPath(pathname);
    document.documentElement.dataset.farmTheme = farmSlug ?? "home";
    document.body.dataset.farmTheme = farmSlug ?? "home";
  }, [pathname]);

  useEffect(() => {
    function syncViewport() {
      const viewportHeight = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--app-height", `${viewportHeight}px`);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        window.setTimeout(syncViewport, 50);
      }
    }

    function handlePopState() {
      setPathname(normalizePath(window.location.pathname));
    }

    syncViewport();
    window.addEventListener("pageshow", syncViewport);
    window.addEventListener("orientationchange", syncViewport);
    window.addEventListener("resize", syncViewport);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", syncViewport);
      window.removeEventListener("orientationchange", syncViewport);
      window.removeEventListener("resize", syncViewport);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  function navigate(nextPath: string) {
    const normalized = normalizePath(nextPath);
    if (normalized === pathname) {
      return;
    }

    window.history.pushState({}, "", normalized);
    setPathname(normalized);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const activeFarmSlug = getFarmSlugFromPath(pathname);
  const activeFarm = activeFarmSlug ? farmConfigs[activeFarmSlug] : null;

  return (
    <>
      <Navbar
        currentPath={pathname}
        onNavigate={navigate}
        farms={farmList}
      />
      {activeFarm ? (
        <FarmProvider config={activeFarm}>
          <FarmDashboard />
        </FarmProvider>
      ) : (
        <LandingPage
          farms={farmList}
          farmSummaries={landingFarmSummaries.summaries}
          onNavigateToFarm={navigate}
        />
      )}
    </>
  );
}
