import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppPanel } from "./app/AppPanel";
import { DriverAvailableTripsPage } from "./app/driver/DriverAvailableTripsPage";
import { DriverHomePage } from "./app/driver/DriverHomePage";
import { DriverOrdersPage } from "./app/driver/DriverOrdersPage";
import { LandingPage } from "./app/auth/LandingPage";
import { RoleGuard } from "./app/components/RoleGuard";
import { PassengerHomePage } from "./app/passenger/PassengerHomePage";
import { PassengerOrdersPage } from "./app/passenger/PassengerOrdersPage";
import { PassengerPublishTripPage } from "./app/passenger/PassengerPublishTripPage";
import { PassengerTripsPage } from "./app/passenger/PassengerTripsPage";
import { SplitWorkbenchLayout } from "./layouts/SplitWorkbenchLayout";
import { AppSessionProvider } from "./state/app-session";

export default function App() {
  return (
    <AppSessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplitWorkbenchLayout />}>
            <Route element={<AppPanel />}>
              <Route index element={<Navigate to="/auth" replace />} />
              <Route path="auth" element={<LandingPage />} />

              <Route element={<RoleGuard allowedRole="passenger" />}>
                <Route path="passenger/home" element={<PassengerHomePage />} />
                <Route path="passenger/trips/new" element={<PassengerPublishTripPage />} />
                <Route path="passenger/trips" element={<PassengerTripsPage />} />
                <Route path="passenger/orders" element={<PassengerOrdersPage />} />
              </Route>

              <Route element={<RoleGuard allowedRole="driver" />}>
                <Route path="driver/home" element={<DriverHomePage />} />
                <Route path="driver/available" element={<DriverAvailableTripsPage />} />
                <Route path="driver/orders" element={<DriverOrdersPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AppSessionProvider>
  );
}

