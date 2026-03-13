import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <SignIn
      appearance={{
        variables: {
          colorPrimary: '#10b981',
          colorBackground: '#0f1419',
          colorInputBackground: '#1a1f26',
          colorInputText: '#ffffff',
          colorText: '#ffffff',
          colorTextSecondary: '#94a3b8',
          borderRadius: '0.5rem',
        },
        elements: {
          card: "bg-transparent shadow-none",
          headerTitle: "text-3xl font-bold text-white",
          headerSubtitle: "text-slate-400",
          socialButtonsBlockButton: "bg-transparent border-[#2a2f36] text-white hover:bg-[#1a1f26]",
          dividerLine: "bg-[#2a2f36]",
          dividerText: "text-slate-500",
          formFieldLabel: "text-white",
          formFieldInput: "bg-[#1a1f26] border-[#2a2f36] text-white placeholder:text-slate-500 focus:border-emerald-500",
          formButtonPrimary: "bg-emerald-500 hover:bg-emerald-600 text-black font-semibold",
          footerActionText: "text-slate-400",
          footerActionLink: "text-emerald-400 hover:text-emerald-300",
        },
      }}
    />
  );
}
