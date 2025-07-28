// src/app/login/page.tsx
import Navbar from "@/components/NavBar";
import { LoginPage } from '@/components/AuthComponents';

export default function Login() {
  return (
    <>
      <Navbar />
      <LoginPage />
    </>
  );
}