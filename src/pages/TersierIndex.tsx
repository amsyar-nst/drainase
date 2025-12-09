import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const TersierIndex = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the main DrainaseForm for creating/editing tersier reports
    navigate("/drainase/new", { replace: true });
  }, [navigate]);

  return null; // This component will not render anything, just redirect
};

export default TersierIndex;