const puppeteer = require('puppeteer')
const { expect }  = require('chai')


const loginEmail = process.env.MATTERMOST_EMAIL;
const loginPassword = process.env.MATTERMOST_PWD;
const mattermostUrl = 'https://mattermost-csc510-9.herokuapp.com/alfred/channels/town-square';
const PROCESSING = 2000;  

async function login(browser, url) {
  const page = await browser.newPage();

  await page.goto(url, {waitUntil: 'networkidle0'});

  // Login
  await page.type('input[id=loginId]', loginEmail);
  await page.type('input[id=loginPassword]', loginPassword);
  await page.click('button[id=loginButton]');

  // Wait for redirect
  await page.waitForNavigation();
  return page;
}

async function postMessage(page, msg)
{
  // Waiting for page to load
  await page.waitForSelector('#post_textbox');

  // Focus on post textbox and press enter.
  await page.focus('#post_textbox')
  await page.keyboard.type( msg );
  await page.keyboard.press('Enter');
}

describe('Test file update usecase', function () {

    var browser;
    var page;

    this.timeout(5000000);

    beforeEach(async () => {
        browser = await puppeteer.launch({headless: false, args: ["--no-sandbox", "--disable-web-security"]});
        page = await login( browser, `${mattermostUrl}/login` );
    });

    afterEach(async () => {
        await page.waitFor(PROCESSING);
        await browser.close();
    });
 

    it ('should add collaborators to an existing file with given permission update a file on drive', async () => {
        
        let filename = 'Resource.pdf';
        let msg =  "@alfred add @ridhim @shubham as collaborators with read and edit access in " + filename;
        await postMessage(page,msg);
        await page.waitFor(PROCESSING);
        await page.waitForSelector('button[aria-label="alfred"]');
        const botResponse = await page.evaluate(() => {
            // fetches latest response from the bot
            return Array.from(document.querySelectorAll('div.post-message__text')).pop().children[0].textContent;
        });

        expect(botResponse).to.contain("Updated collaborators");
    });
    
    it('should validate file extension', async () => {
        let filename = '.';
        let msg = "@alfred add @ridhim @shubham as collaborators with read and edit access in " + filename;
        await postMessage(page, msg);
    
        await page.waitFor(PROCESSING);
        await page.waitForSelector('button[aria-label="alfred"]');
    
        const botResponse = await page.evaluate(() => {
          // fetches latest response from the bot
          return Array.from(document.querySelectorAll('div.post-message__text')).pop().children[0].textContent;
        });
    
        expect(botResponse).to.contain("Please Enter a valid file name");
      });
    
    it('should validate file name', async () => {
        let filename = 'Resource.exe';
        let msg = "@alfred add @ridhim @shubham as collaborators with read and edit access in " + filename;
        await postMessage(page, msg);
    
        await page.waitFor(PROCESSING);
        await page.waitForSelector('button[aria-label="alfred"]');
    
        const botResponse = await page.evaluate(() => {
          // fetches latest response from the bot
          return Array.from(document.querySelectorAll('div.post-message__text')).pop().children[0].textContent;
        });
    
        expect(botResponse).to.contain("Please enter a supported file extension.");
      });
}); 