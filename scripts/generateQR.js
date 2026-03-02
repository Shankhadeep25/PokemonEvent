/**
 * ====================================================
 *  QR CODE GENERATOR — Pokémon Hunt
 * ====================================================
 *
 * Generates a QR code PNG for every Pokémon.
 * Each QR encodes the Pokémon's unique UUID.
 *
 * Output:
 *   • qr-codes/<PokemonName>.png   — individual QR images
 *   • qr-codes/qr-mapping.json     — name ↔ UUID lookup
 *
 * Run:  node scripts/generateQR.js
 */

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// ---- Same 100 Pokémon as seed.js ----
const pokemonNames = [
    'Bulbasaur', 'Ivysaur', 'Venusaur', 'Charmander', 'Charmeleon',
    'Charizard', 'Squirtle', 'Wartortle', 'Blastoise', 'Caterpie',
    'Metapod', 'Butterfree', 'Weedle', 'Kakuna', 'Beedrill',
    'Pidgey', 'Pidgeotto', 'Pidgeot', 'Rattata', 'Raticate',
    'Spearow', 'Fearow', 'Ekans', 'Arbok', 'Pikachu',
    'Raichu', 'Sandshrew', 'Sandslash', 'Nidoran♀', 'Nidorina',
    'Nidoqueen', 'Nidoran♂', 'Nidorino', 'Nidoking', 'Clefairy',
    'Clefable', 'Vulpix', 'Ninetales', 'Jigglypuff', 'Wigglytuff',
    'Zubat', 'Golbat', 'Oddish', 'Gloom', 'Vileplume',
    'Paras', 'Parasect', 'Venonat', 'Venomoth', 'Diglett',
    'Dugtrio', 'Meowth', 'Persian', 'Psyduck', 'Golduck',
    'Mankey', 'Primeape', 'Growlithe', 'Arcanine', 'Poliwag',
    'Poliwhirl', 'Poliwrath', 'Abra', 'Kadabra', 'Alakazam',
    'Machop', 'Machoke', 'Machamp', 'Bellsprout', 'Weepinbell',
    'Victreebel', 'Tentacool', 'Tentacruel', 'Geodude', 'Graveler',
    'Golem', 'Ponyta', 'Rapidash', 'Slowpoke', 'Slowbro',
    'Magnemite', 'Magneton', 'Farfetchd', 'Doduo', 'Dodrio',
    'Seel', 'Dewgong', 'Grimer', 'Muk', 'Shellder',
    'Cloyster', 'Gastly', 'Haunter', 'Gengar', 'Onix',
    'Drowzee', 'Hypno', 'Krabby', 'Kingler', 'Voltorb', 'Electrode',
];

const OUTPUT_DIR = path.join(__dirname, '..', 'qr-codes');

async function generateAllQRCodes() {
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const mapping = {};

    console.log('🔲  Generating QR codes for all Pokémon...\n');

    for (const name of pokemonNames) {
        const uuid = uuidv4();
        mapping[name] = uuid;

        // Sanitize filename (remove special chars like ♀ ♂)
        const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const filePath = path.join(OUTPUT_DIR, `${safeName}.png`);

        await QRCode.toFile(filePath, uuid, {
            type: 'png',
            width: 400,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
            errorCorrectionLevel: 'H', // High error correction for physical print
        });

        console.log(`  ✓ ${name.padEnd(15)} → ${safeName}.png  (${uuid})`);
    }

    // Save the mapping JSON
    const mappingPath = path.join(OUTPUT_DIR, 'qr-mapping.json');
    fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));

    console.log(`\n📄 Mapping saved to: qr-codes/qr-mapping.json`);
    console.log(`\n🎉 Done! Generated ${pokemonNames.length} QR codes in the "qr-codes/" folder.`);
    console.log(`\n💡 TIP: Use qr-mapping.json with your seed script to keep UUIDs in sync.`);
}

generateAllQRCodes().catch((err) => {
    console.error('QR generation error:', err);
    process.exit(1);
});
