const fs = require('fs');
const path = require('path');

const trainTypes = [
  { type: 'Rajdhani Express', coach: 'AC', basePrice: 2200, seats: 60, prefix: '123' },
  { type: 'Shatabdi Express', coach: 'Chair Car', basePrice: 850, seats: 50, prefix: '120' },
  { type: 'Vande Bharat Express', coach: 'Chair Car', basePrice: 1450, seats: 50, prefix: '224' },
  { type: 'Duronto Express', coach: 'Sleeper', basePrice: 480, seats: 72, prefix: '122' },
  { type: 'Garib Rath Express', coach: 'AC', basePrice: 950, seats: 78, prefix: '129' },
  { type: 'Intercity Express', coach: 'Second Sitting', basePrice: 220, seats: 80, prefix: '121' },
  { type: 'Superfast Express', coach: 'Sleeper', basePrice: 380, seats: 72, prefix: '125' },
  { type: 'Mail Express', coach: 'General', basePrice: 80, seats: 90, prefix: '110' },
  { type: 'Passenger', coach: 'General', basePrice: 50, seats: 80, prefix: '511' },
  { type: 'MEMU', coach: 'General', basePrice: 40, seats: 100, prefix: '640' }
];

const cities = ['Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Bengaluru', 'Lucknow', 'Kanpur', 'Patna', 'Jaipur', 'Agra', 'Varanasi', 'Bhopal', 'Indore', 'Pune', 'Nagpur', 'Hyderabad', 'Ahmedabad', 'Surat'];

const trains = [];
const seenNumbers = new Set();

while (trains.length < 200) {
  const typeObj = trainTypes[Math.floor(Math.random() * trainTypes.length)];
  const fromCity = cities[Math.floor(Math.random() * cities.length)];
  let toCity = cities[Math.floor(Math.random() * cities.length)];
  while (toCity === fromCity) {
    toCity = cities[Math.floor(Math.random() * cities.length)];
  }
  
  // Make a unique 5-digit train number
  const uniqueId = String(trains.length + 1).padStart(2, '0');
  const trainNumber = `${typeObj.prefix}${uniqueId}`;
  
  if (seenNumbers.has(trainNumber)) continue;
  seenNumbers.add(trainNumber);
  
  const trainName = `${fromCity} - ${toCity} ${typeObj.type}`;
  trains.push({
    trainNumber,
    trainName,
    coachName: typeObj.coach,
    totalSeats: typeObj.seats,
    basePrice: typeObj.basePrice
  });
}

fs.writeFileSync(path.join(__dirname, 'trains.json'), JSON.stringify(trains, null, 2));
console.log('Generated 200 unique trains in trains.json successfully.');
