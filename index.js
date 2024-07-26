const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const csv = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const xml2js = require('xml2js');

// Use dynamic import for p-limit
let pLimit;
(async () => {
  pLimit = (await import('p-limit')).default;

  puppeteer.use(StealthPlugin());

  const concurrencyLimit = 15;
  const limit = pLimit(concurrencyLimit);

  async function getAllUrlsFromSitemap(sitemapUrl) {
    let browser;
    try {
      browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      const response = await page.goto(sitemapUrl, {
        waitUntil: 'networkidle0',
        timeout: 60000,
      });

      const xml = await response.text();

      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xml);

      const urls = result.urlset.url.map(entry => entry.loc[0]);

      return urls;
    } catch (error) {
      console.error('Error fetching or parsing sitemap:', error);
      return [];
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async function processUrl(browser, url) {
    console.log(url)
    const page = await browser.newPage();

    try {
      // Handle alerts by clicking "Enter"
      page.on('dialog', async dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        await dialog.accept();
      });

      await page.goto(url, { waitUntil: 'domcontentloaded' });

      await page.waitForSelector('body');
      await delay(3000); // Adjust delay time as per your requirement
      const data = await page.evaluate(() => {
        // const content = document.querySelectorAll('a[href$=".csv"], a[href$=".xls"], a[href$=".xlsx"], a[href$=".zip"]');
        // content.forEach(anchor => {
        //   window.location.href = anchor.href;
        // });

        const anchors = document.querySelectorAll('a[href$=".csv"], a[href$=".xls"], a[href$=".xlsx"], a[href$=".zip"], a[href$=".pdf"]');
        const files = [];
        anchors.forEach(anchor => {
          files.push({
            url: anchor.href,
            title: document.title
          });
        });
        return files;
      });

      try {
        await page.evaluate(() => {
          // Define a function to check if URL contains 'csv'
          const shouldFetchCSV = (url) => {
            return url.includes('csv');
          };

          // Modify your logRequests function to intercept requests and conditionally fetch CSV files
          const logRequests = () => {
            // Using `fetch` to intercept requests
            const originalFetch = window.fetch;
            window.fetch = function () {
              const url = arguments[0];
              console.log('HTTPS Request:', url); // Log the request URL

              // Check if URL contains 'csv' and fetch if true
              if (shouldFetchCSV(url)) {
                return originalFetch.apply(this, arguments)
                  .then(response => {
                    if (!response.ok) {
                      throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.blob(); // assuming the response is binary data (CSV)
                  })
                  .then(blob => {
                    // Create a link element
                    const a = document.createElement('a');
                    a.style.display = 'none';

                    // Create a URL for the blob data
                    const csvUrl = window.URL.createObjectURL(blob);

                    // Set the href and download attributes to simulate download
                    a.href = csvUrl;
                    a.download = 'nifty_data.csv'; // suggest downloading a file named "nifty_data.csv"

                    // Append the link to the body and click it programmatically
                    document.body.appendChild(a);
                    a.click();

                    // Clean up resources
                    window.URL.revokeObjectURL(csvUrl);
                    document.body.removeChild(a);

                    console.log('CSV file downloaded successfully');
                  })
                  .catch(error => {
                    console.error('Failed to download CSV file:', error.message);
                  });
              }

              return originalFetch.apply(this, arguments);
            };

            // Using `XMLHttpRequest` to intercept requests
            const originalOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function () {
              const url = arguments[1];
              console.log('HTTPS Request:', url); // Log the request URL

              // Check if URL contains 'csv' and fetch if true
              if (shouldFetchCSV(url)) {
                this.addEventListener('load', function () {
                  if (this.status === 200) {
                    const contentType = this.getResponseHeader('content-type');
                    if (contentType && contentType.includes('csv')) {
                      const blob = new Blob([this.response], { type: 'text/csv' });

                      // Create a link element
                      const a = document.createElement('a');
                      a.style.display = 'none';

                      // Create a URL for the blob data
                      const csvUrl = window.URL.createObjectURL(blob);

                      // Set the href and download attributes to simulate download
                      a.href = csvUrl;
                      let name = document.title
                      a.download = name + '@' + 'nse_data.csv'; // suggest downloading a file named "nifty_data.csv"

                      // Append the link to the body and click it programmatically
                      document.body.appendChild(a);
                      a.click();

                      // Clean up resources
                      window.URL.revokeObjectURL(csvUrl);
                      document.body.removeChild(a);

                      console.log('CSV file downloaded successfully');
                    } else {
                      console.error('Failed to download CSV file: Response is not CSV');
                    }
                  } else {
                    console.error('Failed to download CSV file: HTTP error! Status:', this.status);
                  }
                });
              }

              return originalOpen.apply(this, arguments);
            };
          };

          // Call the function to start logging and intercepting requests
          logRequests();
        })
      }
      catch (err) {
        console.log(err)
      }

      try {
        await page.evaluate(() => {
          try {
            document.getElementById("dwldcsv").click()
          }
          catch {

          }
          const downloadLinks = document.querySelectorAll('a[href^="javascript:downloadCSV("]');

          downloadLinks.forEach((element) => {
            element.click()
          });

          if (typeof dnldEqtDer === "function") {
            dnldEqtDer();
          } else {
            console.warn('dnldEqtDer function is not defined on this page.');
          }

          const links = document.querySelectorAll('a[onclick="downloadCSV()"]');
          links.forEach(link => link.click());
  
          // const downloadLinks = Array.from(document.querySelectorAll('a[href^="javascript:"]'));
          // const targetLink = downloadLinks.find(link => link.href.includes('javascript:'));
          // if (targetLink) {
          //   targetLink.click();
          // } else {
          //   console.warn('Anchor with href containing "javascript:downloadCSV(" not found.');
          // }
        });
        
    
      } catch (error) {
        console.error('Error clicking the download link:', error);
      }


      const pageTitle = await page.title();
      const pageTitleSanitized = pageTitle.replace(/ /g, "_").replace(/\//g, "_");
      function ensureDirectoryExistence(dirPath) {
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      }
      
      let newurl = url.replace("https://www.nseindia.com", "");
      newurl = newurl.replace(/[^a-zA-Z0-9/-]/g, "");
      ensureDirectoryExistence(`files/${newurl}/`);
      if (data.length > 0) {
        const csvWriter = csv({
          path: `files/${newurl}/${pageTitleSanitized}.csv`,
          header: [
            { id: 'url', title: 'URL' },
            { id: 'title', title: 'Title' }
          ]
        });
        await csvWriter.writeRecords(data);
        console.log('CSV file has been saved successfully.');
      }
    } catch (error) {
      console.error('Error processing URL:', error);
    } finally {
      // Introduce a delay of 2 seconds before closing the page
      await delay(4000); // Adjust delay time as per your requirement
      await page.close();
    }
  }

  async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function main() {
    const sitemapUrl = 'https://www.nseindia.com/sitemap.xml';
    const urls = await getAllUrlsFromSitemap(sitemapUrl);
    console.log('Urls Found')
    console.log(urls.length)

    const browser = await puppeteer.launch(
      {
        headless: false,
        args: ['--no-sandbox']
      }
    );

    await Promise.all(urls.map(url =>
      limit(() => processUrl(browser, url))
    ));

    await browser.close();
  }

  main().catch(error => {
    console.error('Error in main execution:', error);
  });
})();