import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../App";

describe("routing guards", () => {
  it("shows auth landing for guest by default", async () => {
    render(<App />);

    expect(await screen.findByText("欢迎进入顺风车平台")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "注册并登录" })).toBeInTheDocument();
  });
});
