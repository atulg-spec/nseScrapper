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
            a.download = name +'@'+ 'nse_data.csv'; // suggest downloading a file named "nifty_data.csv"
            
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
