import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, PrivateRoute, PublicRoute } from "./AuthProvider.jsx";

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

vi.stubGlobal("localStorage", localStorageMock);

const LoginPage = () => <div>Login Page</div>;
const DashboardPage = () => <div>Dashboard Page</div>;

// JWT with exp far in the future (year 2099): header.payload.signature
// payload: { userId: "1", email: "test@example.com", username: "testuser", exp: 4070908800 }
const MOCK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  btoa(JSON.stringify({ userId: "1", email: "test@example.com", username: "testuser", exp: 4070908800 }))
    .replace(/=/g, "") +
  ".mock_signature";

describe("Auth route guards", () => {
  beforeEach(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
  });

  it("redirects unauthenticated users from /dashboard to /login", () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/Dashboard"]}>
          <Routes>
            <Route path="/Login" element={<LoginPage />} />
            <Route
              path="/Dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText("Login Page")).toBeDefined();
  });

  it("redirects authenticated users from /login to /dashboard", () => {
    localStorage.setItem("user", JSON.stringify({ username: "testuser", email: "test@example.com" }));
    localStorage.setItem("authToken", MOCK_TOKEN);

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/Login"]}>
          <Routes>
            <Route
              path="/Login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route path="/Dashboard" element={<DashboardPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText("Dashboard Page")).toBeDefined();
  });
});
