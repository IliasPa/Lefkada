import type { Poll, PollProtections } from '@/data/voting';

/**
 * The protections a referendum can be created with. The mayor picks them per
 * poll in /admin; the database enforces them and locks them once the poll is
 * published. Citizens are shown ONLY the ones a poll does not use
 * (components/ProtectionNotice.tsx) — a fully protected poll shows nothing.
 *
 * `label` / `text` are i18n keys; `text` explains what the ABSENCE means.
 */
export interface ProtectionDef {
  key: keyof PollProtections;
  label: string;
  text: string;
  active: (p: PollProtections) => boolean;
}

export const PROTECTIONS: ProtectionDef[] = [
  { key: 'hideUntilClose', label: 'prot_hide_label', text: 'prot_hide_text', active: (p) => p.hideUntilClose },
  { key: 'minVotes', label: 'prot_min_label', text: 'prot_min_text', active: (p) => p.minVotes > 0 },
  { key: 'anonymous', label: 'prot_anon_label', text: 'prot_anon_text', active: (p) => p.anonymous },
  { key: 'encrypted', label: 'prot_enc_label', text: 'prot_enc_text', active: (p) => p.encrypted },
  { key: 'taxisOnly', label: 'prot_taxis_label', text: 'prot_taxis_text', active: (p) => p.taxisOnly },
];

/** No protections at all — what a bundled demo poll runs with. */
export const NO_PROTECTIONS: PollProtections = {
  hideUntilClose: false, minVotes: 0, anonymous: false, encrypted: false, taxisOnly: false,
};

export function inactiveProtections(poll: Poll): ProtectionDef[] {
  const p = poll.protections ?? NO_PROTECTIONS;
  return PROTECTIONS.filter((d) => !d.active(p));
}
