import { cn } from "@/lib/utils";

interface PaymentLogosProps {
  className?: string;
  variant?: "light" | "dark";
  size?: "sm" | "md";
}

function VisaLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="780" height="500" rx="40" fill="#1A1F71"/>
      <path d="M293.2 348.7l33.4-195.7h53.4l-33.4 195.7H293.2zm221.5-190.9c-10.6-4-27.1-8.3-47.8-8.3-52.7 0-89.8 26.5-90.1 64.5-.3 28.1 26.5 43.8 46.8 53.1 20.8 9.6 27.8 15.7 27.7 24.3-.1 13.1-16.6 19.1-32 19.1-21.4 0-32.7-3-50.3-10.2l-6.9-3.1-7.5 43.8c12.5 5.5 35.6 10.2 59.6 10.5 56.1 0 92.5-26.2 92.9-66.8.2-22.3-14-39.2-44.8-53.2-18.7-9.1-30.1-15.1-30-24.3 0-8.1 9.7-16.8 30.6-16.8 17.5-.3 30.1 3.5 40 7.5l4.8 2.3 7.2-42.4h.2zm134.3-4.8h-41.2c-12.8 0-22.3 3.5-27.9 16.2l-79.2 179.5h56l11.2-29.3h68.5l6.5 29.3h49.5L648.9 153h.1zm-65.8 126l21.2-54.2c-.3.5 4.4-11.3 7.1-18.6l3.6 16.8 12.3 56h-44.2zM285.8 153l-52.4 133.5-5.6-27c-9.7-31.2-39.9-65-73.7-81.9l47.8 171h56.5l84-195.6h-56.6z" fill="white"/>
      <path d="M146.9 153H59.4l-.7 3.8c67 16.2 111.4 55.3 129.7 102.2L170.9 170c-3.2-12.3-12.5-16.5-24-17z" fill="#F9A533"/>
    </svg>
  );
}

function MastercardLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="780" height="500" rx="40" fill="#252525"/>
      <circle cx="330" cy="250" r="140" fill="#EB001B"/>
      <circle cx="450" cy="250" r="140" fill="#F79E1B"/>
      <path d="M390 148.4A139.5 139.5 0 00330 250a139.5 139.5 0 0060 101.6A139.5 139.5 0 00450 250a139.5 139.5 0 00-60-101.6z" fill="#FF5F00"/>
    </svg>
  );
}

function PseLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="780" height="500" rx="40" fill="#002D72"/>
      <text x="390" y="280" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="160" fontWeight="bold">PSE</text>
    </svg>
  );
}

function MercadoPagoLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="780" height="500" rx="40" fill="#00B1EA"/>
      <path d="M390 140c-82.8 0-150 67.2-150 150s67.2 150 150 150 150-67.2 150-150-67.2-150-150-150zm0 250c-55.2 0-100-44.8-100-100s44.8-100 100-100 100 44.8 100 100-44.8 100-100 100z" fill="white"/>
      <circle cx="390" cy="290" r="40" fill="white"/>
    </svg>
  );
}

function AmexLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 780 500" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="780" height="500" rx="40" fill="#006FCF"/>
      <text x="390" y="290" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="120" fontWeight="bold">AMEX</text>
    </svg>
  );
}

export function PaymentLogos({ className, variant = "dark", size = "sm" }: PaymentLogosProps) {
  const logoSize = size === "sm" ? "h-6 w-auto" : "h-8 w-auto";
  const opacity = variant === "light" ? "opacity-60 hover:opacity-100" : "opacity-50 hover:opacity-80";

  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)}>
      {[
        { Component: VisaLogo, name: "Visa" },
        { Component: MastercardLogo, name: "Mastercard" },
        { Component: PseLogo, name: "PSE" },
        { Component: MercadoPagoLogo, name: "Mercado Pago" },
        { Component: AmexLogo, name: "American Express" },
      ].map(({ Component, name }) => (
        <div key={name} className={cn("transition-opacity rounded overflow-hidden", opacity)} title={name}>
          <Component className={logoSize} />
        </div>
      ))}
    </div>
  );
}
