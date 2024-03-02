require("dotenv").config();

const methods = require('./methods');

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AnonymizeUAPlugin = require('puppeteer-extra-plugin-anonymize-ua');


puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUAPlugin());



async function runScript({ 
    username,
    password,
    city,
    radius,
    message,
    gender,
    dob,
    stay,
    occupation,
    language,
    pets,
    expectDate,
    totalPeople}){

    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-notifications',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--start-maximized'
        ]  
    });
    
    let page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('https://kamernet.nl/en');
    page = await methods.login(page, username, password);
    page = await methods.applyFilters(page, city, radius);
    page = await methods.visitListings(
      browser,
      page,
      username,
      message,
      gender,
      dob,
      stay,
      occupation,
      language,
      pets,
      expectDate,
      totalPeople
    );
  
    await browser.close();

}

// runScript();

module.exports = { runScript };