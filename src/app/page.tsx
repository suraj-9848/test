import SignIn from "@/components/SignIn";
import React from "react";

const page = () => {
  console.log("🔍 [ROOT PAGE] Root page component rendered");
  console.log(
    "🔍 [ROOT PAGE] Current URL:",
    typeof window !== "undefined" ? window.location.href : "SSR",
  );
  console.log("🔍 [ROOT PAGE] Timestamp:", new Date().toISOString());

  return (
    <div>
      <SignIn />
    </div>
  );
};

export default page;
