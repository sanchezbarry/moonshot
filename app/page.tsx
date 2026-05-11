import SignupPage from "@/components/SignUpSection";

import { NavBar } from "@/components/NavBar";
import { Hero } from "@/components/Hero";

export default function Home() {
  return (
    <div >
      <NavBar />
      <main>
      <Hero/>
      <SignupPage />


      </main>
    </div>
  );
}
