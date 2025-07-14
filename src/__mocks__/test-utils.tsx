// src/__tests__/test-utils.tsx
import { render, RenderOptions } from "@testing-library/react";
import { UserProvider } from "../contexts/UserContext"; // Adjust path

const defaultUserContext = {
  userId: "user_1",
  preferences: { theme: "light" },
};

interface CustomRenderOptions extends RenderOptions {
  userContext?: typeof defaultUserContext;
}

const customRender = (
  ui: any,
  { userContext = defaultUserContext, ...options }: CustomRenderOptions = {}
) => {
  return render(
    <UserProvider value={userContext}>
      {ui}
    </UserProvider>,
    options
  );
};

export * from "@testing-library/react";
export { customRender as render };