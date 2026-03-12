// Maps sponsor item IDs to logo config for public/sponsors/<file>
// invert: true  → CSS filter: invert(1), use for black-on-white logos with no transparent-bg version
// invert: false → use for already-light or white-on-transparent logos

const sponsorLogos = {
  sponsor_karitraa:     { file: 'karitraa.png',     invert: false },
  sponsor_skilikeagirl: { file: 'skilikeagirl.png', invert: false },
  sponsor_rmu:          { file: 'rmu.png',          invert: true  },
  sponsor_bestday:      { file: 'bestday.png',      invert: false },
  sponsor_beacon:       { file: 'beacon.png',       invert: false },
  sponsor_salidamtn:    { file: 'salidamtn.png',    invert: false },
  sponsor_coalition:    { file: 'coalition.png',    invert: false },
  sponsor_breckmassage: { file: 'breckmassage.png', invert: false },
  sponsor_breckenridge: { file: 'breckenridge.png', invert: false },
  sponsor_glitter:      { file: 'glitter.png',      invert: false },
  sponsor_titsdeep:     { file: 'titsdeep.png',     invert: false },
  sponsor_sunshine:     { file: 'sunshine.png',     invert: false },
}

export default sponsorLogos
