const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const IMAGES_DIR = path.join(__dirname, "images");
const OUTPUT_PDF = path.join(__dirname, "output.pdf");

const CUSTOM_FONT_FILE = 'PressStart2P-Regular.ttf';
const CUSTOM_FONT_NAME = 'PressStart2P'; 
const FONT_FILE_PATH = path.join(__dirname, CUSTOM_FONT_FILE);

const BACKGROUND_IMG_FILE = 'background.png';
const BACKGROUND_IMG_PATH = path.join(__dirname, BACKGROUND_IMG_FILE);
const IMG_WIDTH_MM = 65;
const IMG_HEIGHT_MM = 105;
const GRID_ROWS = 4;
const GRID_COLS = 4;
const GAP_MM = 0.5;
const MARGIN_MM = 10;
const DPI = 300;
const MM_TO_INCHES = 0.0393701;

const IMAGE_PADDING_PT = 10;
const TEXT_AREA_HEIGHT = 45;
const TEXT_HORIZONTAL_PADDING = 5;
const TEXT_FONT_SIZE = 8;
const TEXT_COLOR = 'black';

const TEXT_VERTICAL_OFFSET = 4;

const totalImageWidth = GRID_COLS * IMG_WIDTH_MM;
const totalGapWidth = (GRID_COLS - 1) * GAP_MM;
const totalImageHeight = GRID_ROWS * IMG_HEIGHT_MM;
const totalGapHeight = (GRID_ROWS - 1) * GAP_MM;

const PAGE_WIDTH_MM = totalImageWidth + totalGapWidth + (MARGIN_MM * 2);
const PAGE_HEIGHT_MM = totalImageHeight + totalGapHeight + (MARGIN_MM * 2);

const PAGE_WIDTH_INCHES = PAGE_WIDTH_MM * MM_TO_INCHES;
const PAGE_HEIGHT_INCHES = PAGE_HEIGHT_MM * MM_TO_INCHES;
const IMG_WIDTH_INCHES = IMG_WIDTH_MM * MM_TO_INCHES;
const IMG_HEIGHT_INCHES = IMG_HEIGHT_MM * MM_TO_INCHES;
const GAP_INCHES = GAP_MM * MM_TO_INCHES;
const MARGIN_INCHES = MARGIN_MM * MM_TO_INCHES;

const PT_PER_INCH = 72;
const PAGE_WIDTH = PAGE_WIDTH_INCHES * PT_PER_INCH;
const PAGE_HEIGHT = PAGE_HEIGHT_INCHES * PT_PER_INCH;
const IMG_WIDTH = IMG_WIDTH_INCHES * PT_PER_INCH;
const IMG_HEIGHT = IMG_HEIGHT_INCHES * PT_PER_INCH;
const GAP = GAP_INCHES * PT_PER_INCH;
const MARGIN = MARGIN_INCHES * PT_PER_INCH;

console.log(`Calculated Page Size: ${PAGE_WIDTH_MM}mm x ${PAGE_HEIGHT_MM}mm`);
console.log(`(${PAGE_WIDTH_INCHES.toFixed(2)}in x ${PAGE_HEIGHT_INCHES.toFixed(2)}in)`);
console.log(`Box Size: ${IMG_WIDTH_MM}mm x ${IMG_HEIGHT_MM}mm`);
console.log(`Margin: ${MARGIN_MM}mm, Gap: ${GAP_MM}mm`);

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR);
  console.log("'images' directory created.");
  console.log("Add images to this folder and run again.");
  process.exit();
}
const allFiles = fs.readdirSync(IMAGES_DIR);

const images = allFiles
  .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
  .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
if (images.length === 0) {
  console.log("No images found in 'images' directory.");
  console.log("Please add images and run again.");
  process.exit();
}
console.log(`Found ${images.length} images.`);

const perRow = GRID_COLS;
const perCol = GRID_ROWS;
const perPage = perRow * perCol;
console.log(`Grid: ${perRow} cols x ${perCol} rows (${perPage} per page)`);

const doc = new PDFDocument({
  size: [PAGE_WIDTH, PAGE_HEIGHT],
  margin: 0
});
doc.pipe(fs.createWriteStream(OUTPUT_PDF));

if (!fs.existsSync(FONT_FILE_PATH)) {
  console.error(`FATAL ERROR: Font file not found: ${CUSTOM_FONT_FILE}`);
  console.error('Please download it from https://fonts.google.com/specimen/Press+Start+2P');
  console.error('And place it in the same folder as the script.');
  process.exit(1); 
}
doc.registerFont(CUSTOM_FONT_NAME, FONT_FILE_PATH);
console.log(`Custom font '${CUSTOM_FONT_FILE}' registered successfully.`);
if (!fs.existsSync(BACKGROUND_IMG_PATH)) {
  console.error(`FATAL ERROR: Background image file not found: ${BACKGROUND_IMG_FILE}`);
  console.error(`Please make sure '${BACKGROUND_IMG_FILE}' is in the same folder as the script.`);
  process.exit(1);
}
console.log(`Background image '${BACKGROUND_IMG_FILE}' loaded successfully.`);

function addImagesToPage(pageImages) {
  let currentX = MARGIN;
  let currentY = MARGIN;

  for (let i = 0; i < pageImages.length; i++) {
    const imgFileNameWithExt = pageImages[i];
    const imgPath = path.join(IMAGES_DIR, imgFileNameWithExt);
    const imgName = path.parse(imgFileNameWithExt).name;

    const displayName = imgName.toUpperCase();

    doc.rect(currentX, currentY, IMG_WIDTH, IMG_HEIGHT)
       .lineWidth(1)
       .strokeColor('black')
       .stroke();
    try {
        doc.image(BACKGROUND_IMG_PATH, currentX, currentY, {
            width: IMG_WIDTH,
            height: IMG_HEIGHT,
            align: 'center',
            valign: 'center'
        });
    } catch (bgErr) {
        console.error(`Error adding background image: ${bgErr.message}`);

        doc.moveTo(currentX, currentY)
           .lineTo(currentX + IMG_WIDTH, currentY + IMG_HEIGHT)
           .moveTo(currentX + IMG_WIDTH, currentY)
           .lineTo(currentX, currentY + IMG_HEIGHT)
           .strokeColor('red')
           .dash(2)
           .stroke()
           .undash();
    }
    
    try {
      const effectiveImageWidth = IMG_WIDTH - (IMAGE_PADDING_PT * 2);
      const effectiveImageHeight = (IMG_HEIGHT - TEXT_AREA_HEIGHT) - (IMAGE_PADDING_PT * 2);
      const imageX = currentX + IMAGE_PADDING_PT;
      
      
      const imageY = currentY + IMAGE_PADDING_PT; 
    

      doc.image(imgPath, imageX, imageY, {
        fit: [effectiveImageWidth, effectiveImageHeight],
        align: 'center',
        valign: 'center'
      });
    } catch (err) {
      console.error(`Error skipping image: ${imgPath}.`);
      doc.moveTo(currentX + 5, currentY + 5)
         .lineTo(currentX + IMG_WIDTH - 5, currentY + IMG_HEIGHT - 5)
         .moveTo(currentX + IMG_WIDTH - 5, currentY + 5)
         .lineTo(currentX + 5, currentY + IMG_HEIGHT - 5)
         .strokeColor('red')
         .dash(5)
         .stroke()
         .undash();
    }

    const textX = currentX + TEXT_HORIZONTAL_PADDING;
  
    const textY = (currentY + IMG_HEIGHT) - (TEXT_AREA_HEIGHT / 2) - (TEXT_FONT_SIZE / 2) - TEXT_VERTICAL_OFFSET;
    const textWidth = IMG_WIDTH - (TEXT_HORIZONTAL_PADDING * 2);

    doc.fillColor(TEXT_COLOR)
       .font(CUSTOM_FONT_NAME)
       .fontSize(TEXT_FONT_SIZE)
       .text(displayName, textX, textY, {
         width: textWidth,
         align: 'center',
         ellipsis: true,
         lineBreak: false
       });

    currentX += IMG_WIDTH + GAP;

    if ((i + 1) % perRow === 0) {
      currentX = MARGIN;
      currentY += IMG_HEIGHT + GAP;
    }
  }
}

for (let i = 0; i < images.length; i += perPage) {
  console.log(`Processing page ${Math.floor(i / perPage) + 1}...`);
  const pageBatch = images.slice(i, i + perPage);
  addImagesToPage(pageBatch);

  if (i + perPage < images.length) {
    doc.addPage();
  }
}

doc.end();
console.log(`PDF created: ${OUTPUT_PDF}`);