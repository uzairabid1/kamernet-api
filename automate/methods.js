const sqlite3 = require('sqlite3').verbose();

const dbUtil = require('./dbUitl');

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function login(page, username, password) {

    try {
        await delay(2000);
        //click on login button
        await page.waitForXPath("//a[.='Log in']");
        const [loginButton] = await page.$x("//a[.='Log in']");
        await loginButton.evaluate(loginButton => loginButton.click());

        //filling in with username and password
        await page.waitForXPath("//input[@id='email']");
        await page.type("#email", username, { delay: 100 });
        await page.type("#password", password, { delay: 100 });
        await delay(1000);
        //clicking the submit button
        await page.waitForXPath("//span[.='Log In']/parent::button");
        const [submitButton] = await page.$x("//span[.='Log In']/parent::button");
        await submitButton.evaluate(submitButton => submitButton.click());
        await delay(4000);

        console.log("Logged in");
        return page;
    } catch (error) {
        return false;
    }
}



async function applyFilters(page, city, radius) {

    //get url and search
    const DISTANCE_INDEX = {
        '0': 1,
        '1': 2,
        '2': 3,
        '5': 4,
        '10': 5,
        '20': 6
    }

    let radiusValue = DISTANCE_INDEX[radius].toString();

    await page.goto(`https://kamernet.nl/en/for-rent/rooms-${city.toLowerCase()}?radius=${radiusValue}&minSize=&maxRent=0&searchview=1`)
    await delay(2000);

    return page;
}

async function getListings(page, username) {

    await dbUtil.setupDatabase();

    // Open a SQLite database (create it if not exists)
    const db = new sqlite3.Database('listings.db');

    // Create a table if it doesn't exist
    db.run('CREATE TABLE IF NOT EXISTS listings (username TEXT, url TEXT PRIMARY KEY)');

    // Getting new listing URLs
    let newListings = [];

    await page.waitForSelector("a.ListingCard_root__xVYYt");
    let listingsElements = await page.$$("a.ListingCard_root__xVYYt");

    for (let element of listingsElements) {
        let listingLink = await page.evaluate(element => element.getAttribute('href'), element);
        let fullUrl = "https://kamernet.nl/" + listingLink;

        // Check if the listing is new for the specific user

        const isExisting = await dbUtil.checkIfListingExists(db, username, fullUrl);
        if (!isExisting) {
            newListings.push(fullUrl);
            await dbUtil.insertListing(db, username, fullUrl);
        }
    }

    // Close the database connection
    db.close();

    console.log(newListings);
    return newListings;
}


async function visitListings(page, username, message, gender, dob, stay, occupation, language, pets, expectDate, totalPeople) {

    //visit listings
    let listings = await getListings(page, username);
    for (let listing of listings) {
        await page.goto(listing);
        await delay(2000);
        
        const [contactButton] = await page.$x("(//button[.='Contact landlord'])[1]");
        let [roomName] = await page.$x("//div[contains(@class,'Header_details')]/a");
        let [landLordName] = await page.$x("//div[contains(@class,'LandlordProfile_profile')]/div/h6");
        landLordName = await landLordName.evaluate(landLordName => landLordName.textContent.trim());
        roomName = await roomName.evaluate(roomName => roomName.textContent.trim())


        if (!contactButton) {
            console.log('contact button not found, skipping...')
            continue
        }

        await contactButton.evaluate(contactButton => contactButton.click());
        await delay(2000);
        await react(page, message, gender, dob, stay, occupation, language, pets, expectDate, totalPeople);
        console.log(`------Message with data sent to ${landLordName} for room at ${roomName}------`);
    }
}

async function selectMessage(page, message) {
    //send message
    await page.waitForXPath("//textarea[@id='Message']");
    await page.type("#Message", message, { delay: 30 });

    console.log('message selected');
}

async function selectGender(page, gender) {
    //select gender
    await page.waitForXPath("//span[.='Male']/parent::div");
    if (gender == "Male") {
        const [maleButton] = await page.$x("//span[.='Male']/parent::div");
        await maleButton.evaluate(maleButton => maleButton.click());
    } else if (gender == "Female") {
        const [femaleButton] = await page.$x("//span[.='Female']/parent::div");
        await femaleButton.evaluate(femaleButton => femaleButton.click());
    } else {
        const [notImportantButton] = await page.$x("//span[.='Not important']/parent::div");
        await notImportantButton.evaluate(notImportantButton => notImportantButton.click());
    }
    await delay(1000);

    console.log('gender selected');
}

async function selectDob(page, dob) {

    let [day, month, year] = dob.split('-').map(Number);
    month = (month - 1).toString().replace('0', '').trim();
    day = day.toString().replace('0', '').trim();

    await page.waitForXPath("//input[@id='DateOfBirth']");
    const [dateButton] = await page.$x("//input[@id='DateOfBirth']");
    await dateButton.evaluate(dateButton => dateButton.click());
    await delay(1000);

    await page.waitForSelector('select[title="Select a year"]');
    await page.select('select[title="Select a year"]', `${year}`);
    await delay(500);

    await page.waitForSelector('select[title="Select a month"]');
    await page.select('select[title="Select a month"]', `${month}`);
    await delay(500);

    await page.waitForXPath(`//table[@id='DateOfBirth_table']/tbody/tr/td/div[.='${day}']`);
    const [dayButton] = await page.$x(`//table[@id='DateOfBirth_table']/tbody/tr/td/div[.='${day}']`);
    await dayButton.evaluate(dayButton => dayButton.click());
    await delay(500);

    console.log('dob selected');
}

async function selectStay(page, stay) {
    await page.waitForSelector("div#ExpectedTenancyDuration>div>input");
    const stayButton = await page.$("div#ExpectedTenancyDuration>div>input");
    await stayButton.evaluate(stayButton => stayButton.click());
    await delay(500);

    await page.select('select[name="ExpectedTenancyDurationId"]', `${stay.toString()}`);
    
    await page.waitForSelector(`div#ExpectedTenancyDuration>div>ul>li:nth-child(${stay.toString()})`);
    const monthButton = await page.$(`div#ExpectedTenancyDuration>div>ul>li:nth-child(${stay.toString()})`);
    await monthButton.evaluate(monthButton => monthButton.click());
    await delay(500);

    

    await stayButton.evaluate(stayButton => stayButton.click());
    await delay(500);
    console.log('stay selected');
}

async function selectOccupation(page, occupation) {

    await page.waitForSelector("div#Status>div>input");
    const occupationButton = await page.$("div#Status>div>input");
    await occupationButton.evaluate(occupationButton => occupationButton.click());
    await delay(500);

    await page.waitForSelector(`div#Status>div>ul>li:nth-child(${occupation.toString()})`);
    const selectOccupation = await page.$(`div#Status>div>ul>li:nth-child(${occupation.toString()})`);
    await selectOccupation.evaluate(selectOccupation => selectOccupation.click());
    await delay(500);

    await occupationButton.evaluate(occupationButton => occupationButton.click());
    await delay(500);

    console.log('occupation selected');

}

async function selectLanguages(page, languages) {

    let languages_arr = languages.split(",");
    await page.waitForSelector("div#Languages>div>span>input:nth-child(2)");
    const input = await page.$("div#Languages>div>span>input:nth-child(2)");
    await input.click();
    await page.keyboard.press('Backspace');

    for (let language of languages_arr) {
        await page.type("div#Languages>div>span>input:nth-child(2)", `${language}`, { delay: 50 });
        await page.keyboard.press("Enter");
        await delay(1000);
    }

    console.log('languages selected');
}


async function selectPets(page, pets) {
    await page.waitForXPath("//span[.='Yes']/parent::div");

    if (pets == "Yes") {
        const [petsYesButton] = await page.$x("//span[.='Yes']/parent::div");
        await petsYesButton.evaluate(petsYesButton => petsYesButton.click());
    } else {
        const [petsNoButton] = await page.$x("//span[.='No']/parent::div");
        await petsNoButton.evaluate(petsNoButton => petsNoButton.click());
    }
    await delay(1000);

    console.log('pets selected');
}

async function selectExpectDate(page, expectDate) {
    let [day, month, year] = expectDate.split('-').map(Number);
    month = (month - 1).toString().replace('0', '').trim();
    day = day.toString().replace('0', '').trim();

    console.log(day, month, year);

    await page.waitForXPath("//input[@id='ExpectedMoveInDate']");
    const [dateButton] = await page.$x("//input[@id='ExpectedMoveInDate']");
    await dateButton.evaluate(dateButton => dateButton.click());
    await delay(1000);

    await page.waitForSelector("div>select[aria-controls='ExpectedMoveInDate_table']:nth-child(2)");
    await page.select("div>select[aria-controls='ExpectedMoveInDate_table']:nth-child(2)", `${year}`);
    await delay(500);

    await page.waitForSelector("div>select[aria-controls='ExpectedMoveInDate_table']:nth-child(1)");
    await page.select("div>select[aria-controls='ExpectedMoveInDate_table']:nth-child(1)", `${month}`);
    await delay(500);

    await page.waitForXPath(`//table[@id='ExpectedMoveInDate_table']/tbody/tr/td/div[.='${day}']`);
    const [dayButton] = await page.$x(`//table[@id='ExpectedMoveInDate_table']/tbody/tr/td/div[.='${day}']`);
    await dayButton.evaluate(dayButton => dayButton.click());
    await delay(500);

    console.log('expected date selected');
}

async function selectPeopleMovingIn(page, totalPeople) {
    await page.waitForSelector("input#PeopleMovingIn");
    const input = await page.$("input#PeopleMovingIn");
    await input.click();
    await page.keyboard.press('Backspace');
    await delay(500);

    await page.waitForSelector("input#PeopleMovingIn");
    await page.type("input#PeopleMovingIn", `${totalPeople.toString()}`);
    await delay(500);

    console.log('people moving in selected');
}

async function sendMessage(page) {
    await page.waitForXPath("//button[.='Send message']");
    const [sendMessageButton] = await page.$x("//button[.='Send message']");
    await sendMessageButton.evaluate(sendMessageButton => sendMessageButton.click());
    await delay(8000);

    console.log('send button selected');
}

async function react(page, message, gender, dob, stay, occupation, languages, pets, expectDate, totalPeople) {

    await selectMessage(page, message);
    await selectGender(page, gender);
    await selectDob(page, dob);
    await selectStay(page, stay);
    await selectOccupation(page, occupation);
    await selectLanguages(page, languages);
    await selectPets(page, pets);
    await selectExpectDate(page, expectDate);
    await selectPeopleMovingIn(page, totalPeople);
    await sendMessage(page);

}

module.exports = { login, applyFilters, visitListings };
