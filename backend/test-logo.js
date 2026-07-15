const { downloadLogo } = require('./dist/src/import-engine/logoHandler');

(async () => {
  console.log('Testing logo download for amazon.com');
  const logo = await downloadLogo('https://www.amazon.com');
  if (logo) {
    console.log(`Logo downloaded, length: ${logo.byteLength} bytes`);
    const fs = require('fs');
    const Buffer = require('buffer').Buffer;
    const buffer = Buffer.from(logo);
    fs.writeFileSync('amazon-logo.png', buffer);
    console.log('Logo saved as amazon-logo.png');
  } else {
    console.log('No logo downloaded');
  }
})();