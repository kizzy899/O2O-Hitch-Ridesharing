import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { useAppSession, AppSessionProvider } from "../state/app-session";

function Probe() {
  const { state, loginSuccess } = useAppSession();

  return (
    <div>
      <p data-testid="active-role">{state.activeRole}</p>
      <p data-testid="has-passenger">{state.tokens.passengerToken ? "yes" : "no"}</p>
      <p data-testid="has-driver">{state.tokens.driverToken ? "yes" : "no"}</p>
      <button
        type="button"
        onClick={() => {
          loginSuccess("passenger", "p-token", { userId: "passenger001", role: "PASSENGER" });
          loginSuccess("driver", "d-token", { userId: "driver001", role: "DRIVER" });
        }}
      >
        login both
      </button>
    </div>
  );
}

describe("app session", () => {
  it("stores both passenger and driver tokens", async () => {
    render(
      <AppSessionProvider>
        <BrowserRouter>
          <Probe />
        </BrowserRouter>
      </AppSessionProvider>
    );

    expect(screen.getByTestId("has-passenger")).toHaveTextContent("no");
    expect(screen.getByTestId("has-driver")).toHaveTextContent("no");

    fireEvent.click(screen.getByRole("button", { name: "login both" }));

    await waitFor(() => {
      expect(screen.getByTestId("has-passenger")).toHaveTextContent("yes");
      expect(screen.getByTestId("has-driver")).toHaveTextContent("yes");
      expect(screen.getByTestId("active-role")).toHaveTextContent("driver");
    });
  });
});
