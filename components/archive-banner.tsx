import Link from "next/link";

/** Shown on the pages kept from the TMLR version of the study (pre-July 2026 pipeline). */
export default function ArchiveBanner({ what }: { what: string }) {
  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
      <span className="font-semibold">Archived page, TMLR version.</span> {what} It predates the July 2026 force-target frame fix
      and the October 2026 GroundLink unit fix, so its numbers are superseded. Current results:{" "}
      <Link href="/results" className="underline hover:text-white">Results</Link> and{" "}
      <Link href="/replay" className="underline hover:text-white">Force replay</Link>.
    </div>
  );
}
