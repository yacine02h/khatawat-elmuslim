const https = require('https');

const url = "https://api.aladhan.com/v1/timingsByCity?city=Oran&country=Algeria&method=3&adjustment=-1";

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
        const json = JSON.parse(data);
        if(json.data && json.data.date) {
            console.log("Adjustment -1:", json.data.date.hijri.day, json.data.date.hijri.month.en);
        } else {
            console.log("No data found");
        }
    } catch(e) {
        console.log("Error parsing:", data);
    }
  });
});

const url2 = "https://api.aladhan.com/v1/timingsByCity?city=Oran&country=Algeria&method=3&adjustment=0";

https.get(url2, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
        const json = JSON.parse(data);
        if(json.data && json.data.date) {
            console.log("Adjustment 0: ", json.data.date.hijri.day, json.data.date.hijri.month.en);
        }
    } catch(e) {}
  });
});