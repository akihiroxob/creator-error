import { Benefits } from "./components/Benefits";
import { FAQ } from "./components/FAQ";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { ImplementationFlow } from "./components/ImplementationFlow";
import { Problems } from "./components/Problems";
import { ProcessFlow } from "./components/ProcessFlow";
import { Solution } from "./components/Solution";
import { UseCases } from "./components/UseCases";

export default function LandingPage() {
  return (
    <div className="dark min-h-screen bg-[#0f1729] text-white">
      <Hero />
      <Problems />
      <Solution />
      <Benefits />
      <ProcessFlow />
      <ImplementationFlow />
      <UseCases />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
