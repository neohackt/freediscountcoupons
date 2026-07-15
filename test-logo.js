const { downloadLogo } = require('./backend/src/import-engine/logoHandler');

(async () => {
  console.log('Testing logo download for amazon.com');
  const logo = await downloadLogo('https://www.amazon.com');
  if (logo) {
    console.log(`Logo downloaded, length: ${logo.length} bytes`);
    const fs = require('fs');
    fs.writeFileSync('amazon-logo.png', logo);
    console.log('Logo saved as amazon-logo.png');
  } else {
    console.log('No logo downloaded');
  }
})();