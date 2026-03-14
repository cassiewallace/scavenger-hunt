// Maps sponsor item IDs to logo config for public/sponsors/<file>
// lightBg: true  → logo is shown on a white rounded pill (use for colored/dark logos with white bg)
// lightBg: false → logo shown directly on dark card surface (use for white/light transparent logos)

const sponsorLogos = {
  sponsor_karitraa:     { file: 'karitraa.png',                  lightBg: true  },
  sponsor_skilikeagirl: { file: 'skilikeagirl.png',              lightBg: true  },
  sponsor_rmu:          { file: 'rmu.png',                       lightBg: true  },
  sponsor_backcountryready: { file: 'backcountry-ready.png',    lightBg: true  },
  sponsor_bestday:      { file: 'best-day.png',                  lightBg: true  },
  sponsor_beacon:       { file: 'beacon.png',                    lightBg: true  },
  sponsor_salidamtn:    { file: 'salida-mountain-sports.png',    lightBg: false },
  sponsor_coalition:    { file: 'coalition-snow.png',            lightBg: false },
  sponsor_breckmassage: { file: 'breck-mountain-massage.png',    lightBg: true  },
  sponsor_breckenridge: { file: 'breckenridge.png',              lightBg: true  },
  sponsor_glitter:      { file: 'sex-plants-rock-and-roll.png',  lightBg: true  },
  sponsor_titsdeep:     { file: 'tits-deep.png',                 lightBg: true  },
  sponsor_sunshine:     { file: 'sunshine-sauna.png',            lightBg: true  },
}

export default sponsorLogos
