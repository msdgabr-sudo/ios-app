# KLIR External Screen Static Verification

Branch: `klir`

## Results
- PASS: `prayer_shell_exactly_once`
- PASS: `falaki_shell_exactly_once`
- PASS: `azkar_shell_exactly_once`
- PASS: `prayer_fragment_exists`
- PASS: `falaki_fragment_exists`
- PASS: `azkar_fragment_exists`
- PASS: `prayer_loader_exists`
- PASS: `falaki_host_exists`
- PASS: `azkar_host_exists`
- PASS: `legacy_prayer_css_not_loaded`
- PASS: `legacy_azkar_css_not_loaded`
- PASS: `legacy_azkar_particles_removed`
- PASS: `legacy_azkar_inline_js_removed`
- PASS: `home_preserved`
- PASS: `compass_preserved`
- PASS: `bootstrap_preserved`

## External screen rule
- Prayer: `index.html` contains only its route shell; presentation is `pages/prayer.html`.
- Falaki: `index.html` contains only its route shell; presentation is `pages/falaki.html`.
- Azkar: `index.html` contains only its route shell; presentation is `pages/azkar.html`.
- Protected Home and Compass roots remain present.
- This test does not modify astronomical verification algorithms.
