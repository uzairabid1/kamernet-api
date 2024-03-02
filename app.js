const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const { runScript } = require('./automate/runner');

const app = express();
const port = 3000;

let defaultParams = {}; // Set default parameters here

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/react', async (req, res) => {
  try {
    const { username, password, city, radius, message, gender, dob, stay, occupation, language, pets, expectDate, totalPeople } = req.body;

    // Update defaultParams with the latest values
    defaultParams = { username, password, city, radius, message, gender, dob, stay, occupation, language, pets, expectDate, totalPeople };

    await runScript(defaultParams);

    res.json({ message: 'Scraping completed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Schedule the scraping script to run every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  try {
    console.log('Running scraping script at', new Date());
    await runScript(defaultParams); // Pass default parameters
  } catch (error) {
    console.error('Error during scheduled scraping:', error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
