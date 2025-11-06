import { Navigate, useParams } from "react-router-dom";

export function RedirectToOverview() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/dashboard/restaurant/${slug}`} replace />;
}
