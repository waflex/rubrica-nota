// src/components/ui/KoFiButton.jsx

// Minimal Ko-fi button — opens Ko-fi page in a new tab.
// Kept intentionally simple to avoid injecting external scripts or breaking layout.
export default function KoFiButton() {
  return (
    <a
      href="https://ko-fi.com/M4M41YC712"
      target="_blank"
      rel="noopener noreferrer"
      className="ml-2 inline-flex items-center gap-2 text-xs text-white bg-[#72a4f2] hover:bg-[#5f8fe0] px-2 py-1 rounded-lg mt-3"
      aria-label="Apóyame en Ko-fi"
      title="Apóyame en Ko-fi"
    >
      {/* Simple coffee emoji as icon to avoid external assets */}
      <span aria-hidden>☕</span>
      <span className="whitespace-nowrap p-1">Regalame un cafecito</span>
    </a>
  );
}
