const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Configuration
const IMAGES_DIR = path.join(__dirname, "images");
const OUTPUT_PDF = path.join(__dirname, "output.pdf");

// Values for printt
const IMG_WIDTH_MM = 65;
const IMG_HEIGHT_MM = 105;
const GRID_ROWS = 4;
const GRID_COLS = 4;
const GAP_MM = 1.6;       
const MARGIN_MM = 10;   
const DPI = 300;
const MM_TO_INCHES = 0.0393701;

const totalImageWidth = GRID_COLS * IMG_WIDTH_MM;
const totalGapWidth = (GRID_COLS - 1) * GAP_MM;
const totalImageHeight = GRID_ROWS * IMG_HEIGHT_MM;
const totalGapHeight = (GRID_ROWS - 1) * GAP_MM;

const PAGE_WIDTH_MM = totalImageWidth + totalGapWidth + (MARGIN_MM * 2);
const PAGE_HEIGHT_MM = totalImageHeight + totalGapHeight + (MARGIN_MM * 2);

// 2. Convert all values to Inches for the script
const PAGE_WIDTH_INCHES = PAGE_WIDTH_MM * MM_TO_INCHES;
const PAGE_HEIGHT_INCHES = PAGE_HEIGHT_MM * MM_TO_INCHES;
const IMG_WIDTH_INCHES = IMG_WIDTH_MM * MM_TO_INCHES;
const IMG_HEIGHT_INCHES = IMG_HEIGHT_MM * MM_TO_INCHES;
const GAP_INCHES = GAP_MM * MM_TO_INCHES;
const MARGIN_INCHES = MARGIN_MM * MM_TO_INCHES;

//Inches to Pixels
const PT_PER_INCH = 72;
const PAGE_WIDTH = PAGE_WIDTH_INCHES * PT_PER_INCH;
const PAGE_HEIGHT = PAGE_HEIGHT_INCHES * PT_PER_INCH;
const IMG_WIDTH = IMG_WIDTH_INCHES * PT_PER_INCH;
const IMG_HEIGHT = IMG_HEIGHT_INCHES * PT_PER_INCH;
const GAP = GAP_INCHES * PT_PER_INCH;
const MARGIN = MARGIN_INCHES * PT_PER_INCH;

console.log(`Calculated Page Size: ${PAGE_WIDTH_MM}mm x ${PAGE_HEIGHT_MM}mm`);
console.log(`(${PAGE_WIDTH_INCHES.toFixed(2)}in x ${PAGE_HEIGHT_INCHES.toFixed(2)}in)`);
console.log(`Image Size: ${IMG_WIDTH_MM}mm x ${IMG_HEIGHT_MM}mm`);
console.log(`Margin: ${MARGIN_MM}mm, Gap: ${GAP_MM}mm`);

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR);
  console.log("'images' directory created.");
  console.log("Add images to this folder and run again.");
  process.exit();
}

const allFiles = fs.readdirSync(IMAGES_DIR);
const images = allFiles.filter(file => /\.(jpg|jpeg|png)$/i.test(file));

if (images.length === 0) {
  console.log("No images found in 'images' directory.");
  console.log("Please add images and run again.");
  process.exit();
}

console.log(`Found ${images.length} images.`);

// grid layout
const perRow = GRID_COLS;
const perCol = GRID_ROWS;
const perPage = perRow * perCol;

console.log(`Grid: ${perRow} cols x ${perCol} rows (${perPage} per page)`);

const doc = new PDFDocument({
  size: [PAGE_WIDTH, PAGE_HEIGHT],
  margin: 0
});
doc.pipe(fs.createWriteStream(OUTPUT_PDF));

/**
 * @param {string[]} pageImages 
 */
function addImagesToPage(pageImages) {
  let currentX = MARGIN;
  let currentY = MARGIN;

  for (let i = 0; i < pageImages.length; i++) {
    const imgPath = path.join(IMAGES_DIR, pageImages[i]);

    try {
      doc.image(imgPath, currentX, currentY, {
        width: IMG_WIDTH,
        height: IMG_HEIGHT,
        align: 'center',
        valign: 'center'
      });
    } catch (err) {
      console.error(`Error skipping image: ${imgPath}.`);
    
      doc.rect(currentX, currentY, IMG_WIDTH, IMG_HEIGHT)
         .strokeColor('red')
         .dash(5)
         .stroke()
         .undash();
    }

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