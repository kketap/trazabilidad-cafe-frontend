// src/components/auth/ProtectedRoute.tsx
import type { ReactNode } from "react";
import {
  Navigate,
  useLocation,
} from "react-router-dom";

import { getToken } from "../../api/auth";

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const location = useLocation();
  const token = getToken();

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <>{children}</>;
}