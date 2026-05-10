import Image from "next/image";
import SignupPage from "@/components/SignUpSection";
import LoginPage from "@/components/LoginSection";

export default function Home() {
  return (
    <div >
      <main>
      <SignupPage />
      <LoginPage />

      </main>
    </div>
  );
}
