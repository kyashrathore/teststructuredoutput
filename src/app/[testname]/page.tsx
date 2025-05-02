"use server";
import React from "react";
import StressTestPage from "@/app/StressTestPage";

export default async function TestPage({
  params,
}: {
  params: { testname: string };
}) {
  const resolvedParams = await params;
  const testName = decodeURIComponent(resolvedParams.testname);

  return (
    <div className="min-h-screen bg-slate-50">
      <StressTestPage testName={testName} />
    </div>
  );
}
