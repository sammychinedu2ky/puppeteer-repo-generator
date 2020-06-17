#!/usr/bin/env node

let selectors = require('./selectors')

const puppeteer = require('puppeteer');
try {
  let username = process.argv[2];
  let password = process.argv[3];
  let repo_name = process.argv[4]
} catch (error) {
  throw ('ensure you input the username password and repo-name in the correct order')
}

const handle_otp = (page) => {
  return new Promise((res => {
    process.stdout.write('your otp is required \nplease input it below\n')
    process.env.write = "true";

    process.stdin.on('data', async (data) => {
      if (process.env.write != 'false') {

        await page.click(selectors.otp)

        await page.keyboard.type(data.toString())
        await page.waitFor(2000)
        if (await page.evaluate((sel) => document.querySelector(sel), selectors.otp_error)) {
          process.stdout.write('wrong otp, please try again\n')

        } else {
          process.env.write = "false"
          res();
        }
      }
    });
  }));
};

(async () => {

  let username = process.argv[2] == undefined ? console.log('ensure that the username password and repo-name are inputed') || process.exit() : process.argv[2];
  let password = process.argv[3] == undefined ? console.log('ensure that the username password and repo-name are inputed') || process.exit() : process.argv[3];
  let repo_name = process.argv[4] == undefined ? console.log('ensure that the username password and repo-name are inputed') || process.exit() : process.argv[4]
  selectors.username = username
  selectors.password = password
  selectors.repo_name = repo_name


  const browser = await puppeteer.launch({
    headless: true
  });
  const page = await browser.newPage();
  await page.goto('https://github.com/new');
  await page.click(selectors.username_field);
  await page.keyboard.type(selectors.username);
  await page.click(selectors.password_field);
  await page.keyboard.type(selectors.password);
  await page.click(selectors.login_button);
  await page.waitFor(2000);
  if (page.url() == selectors.sec_key_tfa_url) {
    await page.goto(selectors.otp_tfa_url);
    await handle_otp(page);
  }
  if (page.url() == selectors.otp_url) {
    await handle_otp(page);
  }

  await page.waitFor(2000)
  await page.click(selectors.repo_name_field);
  await page.keyboard.type(selectors.repo_name);
  await page.waitFor(2000);
  if (await page.evaluate((sel) => {
    if (document.querySelector(sel) == null) return null
    else return document.querySelector(sel).innerText
  }, selectors.repo_name_err) == selectors.repo_name) {
    await new Promise((async res => {
      let input = await page.evaluate((sel) => document.querySelector(sel).innerText, selectors.repo_name_err)
      let input2 = await page.evaluate((sel) => document.querySelector(sel).innerText, selectors.repo_name_err)
      process.stdout.write(input + '\n please insert a new repo-name\n')
      process.stdin.on('data', async (data) => {
        await page.keyboard.down('Shift');
        await page.keyboard.press('ArrowLeft');
        for (let i = 0; i < input.length; i++)
          await page.keyboard.press('ArrowLeft');
        await page.keyboard.up('Shift');
        await page.keyboard.press('Backspace');
        page.click(selectors.repo_name);
        await page.click(selectors.repo_name)
        await page.keyboard.type(data.toString());
        await page.waitFor(2000)
        if (page.evaluate((sel) => document.querySelector(sel), selectors.repo_name_err) == selectors.fill) {
          let input = await page.evaluate((sel) => document.querySelector(sel).innerText, selectors.repo_name_err)
          process.stdout.write(input + '\n please insert a new repo-name\n')

        } else res();
      })
    }))


  }
  await page.waitFor(2000);
  page.click(selectors.create_repo);
  await page.waitForNavigation();

  let link = await page.evaluate((sel) => {

    return document.querySelector(sel).value

  }, selectors.repo_link)
  console.log(`The link to your repo is ${link}`)
  await browser.close();
  process.exit();
})();