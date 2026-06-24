/** The Bowl of Hygieia — a snake coiled around a cup, the international
 *  pharmacy symbol. Drawn in the lucide stroke style (currentColor). */
export default function BowlOfHygieia({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Cup */}
      <path d="M6.5 9 H17.5" />
      <path d="M7.6 9 C7.6 13.4 9.6 15.6 12 15.6 C14.4 15.6 16.4 13.4 16.4 9" />
      <path d="M12 15.6 V20" />
      <path d="M8.5 20 H15.5" />
      {/* Snake coiling up out of the cup */}
      <path d="M11.8 12.6 C8.4 11 9.4 6.4 13 6.7 C15.6 6.9 15.4 3.7 12.9 3.3" />
      <circle cx="12.6" cy="3.2" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}
