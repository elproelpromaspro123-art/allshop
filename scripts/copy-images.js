/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/Johan/Downloads/ecommerce/allshop/productos-2';
const destDir = 'c:/Users/Johan/Downloads/ecommerce/allshop/public/productos';

const folders = fs.readdirSync(srcDir);

const mapping = {};

for (const folder of folders) {
    const folderPath = path.join(srcDir, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    let targetSlug = '';
    if (folder.includes('Audifonos')) targetSlug = 'audifonos-xiaomi-redmi-buds-4-lite';
    else if (folder.includes('Silla')) targetSlug = 'silla-gamer-premium-reposapies';
    else if (folder.includes('Freidora')) targetSlug = 'air-fryer-freidora-10l-premium';
    else if (folder.includes('Reloj')) targetSlug = 'smartwatch-ultra-series-pantalla-grande';
    else if (folder.includes('Camara')) targetSlug = 'camara-seguridad-bombillo-360-wifi';
    else if (folder.includes('Cepillo')) targetSlug = 'cepillo-electrico-5-en-1-secador-alisador';
    else if (folder.includes('Lampara')) targetSlug = 'lampara-mata-zancudos-electrica';
    if (!targetSlug) continue;

    const targetPath = path.join(destDir, targetSlug);
    if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, { recursive: true });

    const files = fs.readdirSync(folderPath).sort((a, b) => a.localeCompare(b));
    const infoText = files.find(f => f.toLowerCase() === 'informacion.txt') ? fs.readFileSync(path.join(folderPath, 'informacion.txt'), 'utf8') : '';
    const warrantiesText = files.find(f => f.toLowerCase() === 'garantias.txt') ? fs.readFileSync(path.join(folderPath, 'garantias.txt'), 'utf8') : '';

    const images = [];
    for (const file of files) {
        if (file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg') || file.toLowerCase().endsWith('.webp')) {
            const destFile = file.replace(/ /g, '-');
            fs.copyFileSync(path.join(folderPath, file), path.join(targetPath, destFile));
            images.push(`/productos/${targetSlug}/${destFile}`);
        }
    }

    mapping[targetSlug] = {
        images,
        infoText: infoText.trim(),
        warrantiesText: warrantiesText.trim()
    };
}

fs.writeFileSync('c:/Users/Johan/Downloads/ecommerce/allshop/productos-2-mapping.json', JSON.stringify(mapping, null, 2));
