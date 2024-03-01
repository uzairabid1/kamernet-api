const express = require('express');
const bodyParser = require('body-parser');
const { runScript } = require('./runner');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/scrape', async (req, res) => {
  try {
    const { username, password, city, radius, message, gender, dob, stay, occupation, language, pets, expectDate, totalPeople } = req.body;

    await runScript({ username, password, city, radius, message, gender, dob, stay, occupation, language, pets, expectDate, totalPeople });

    res.json({ message: 'Scraping completed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
