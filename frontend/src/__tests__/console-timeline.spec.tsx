import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../App";

describe("flow console timeline", () => {
  it("keeps all steps rendered but constrains timeline in a dedicated scroll window", () => {
    const { container } = render(<App />);

    const timelineWindow = container.querySelector(".timeline-window");
    expect(timelineWindow).toBeInTheDocument();

    const timelineItems = timelineWindow?.querySelectorAll(".timeline-item");
    expect(timelineItems?.length).toBe(13);
  });
});
