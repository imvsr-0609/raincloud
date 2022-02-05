const express = require('express');
require('dotenv').config();
const app = express();
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const { default: axios } = require('axios');

const db = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: process.env.DB_PASSWORD,
	database: 'sql_raincloud',
	port: 3306,
});

const weather_api_key = process.env.OPENWEATHER_API_KEY;
const reverse_geocoding_key = process.env.LOCATION_IQ_API_KEY;

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

//function to parse date-time
const dateTimeConverter = (date) => {
	var myDate = new Date(date * 1000);
	return (
		myDate.getFullYear() +
		'-' +
		('0' + (myDate.getMonth() + 1)).slice(-2) +
		'-' +
		('0' + myDate.getDate()).slice(-2) +
		' ' +
		myDate.getHours() +
		':' +
		('0' + myDate.getMinutes()).slice(-2) +
		':' +
		myDate.getSeconds()
	);
};

//function to parse date
const dateConverter = (date) => {
	var myDate = new Date(date * 1000);
	return (
		myDate.getFullYear() +
		'-' +
		('0' + (myDate.getMonth() + 1)).slice(-2) +
		'-' +
		('0' + myDate.getDate()).slice(-2)
	);
};

//function to fetch weather data
const fetchWeatherData = async (latitude, longitude) => {
	try {
		const { data } = await axios.get(
			`https://api.openweathermap.org/data/2.5/onecall?exclude=minutely,hourly&lat=${latitude}&lon=${longitude}&exclude=minutely,hourly&appid=${weather_api_key}`,
		);
		return data;
	} catch (err) {
		console.log(err);
	}
};

//function to fetch city data
const fetchCityDetails = async (latitude, longitude) => {
	try {
		const { data } = await axios.get(
			`https://eu1.locationiq.com/v1/reverse.php?key=${reverse_geocoding_key}&lat=${latitude}&lon=${longitude}&format=json`,
		);
		return data;
	} catch (err) {
		console.log(err);
	}
};

//promise for querying the daily weather data
getDailyWeather = (cityid) => {
	return new Promise((resolve, reject) => {
		const fetchDailyQuery = `SELECT * FROM daily_weather WHERE city_id = '${cityid}'`;
		db.query(fetchDailyQuery, (err, result) => {
			if (err) return reject(err);
			return resolve(result);
		});
	});
};

//promise to insert a new location
insertNewLocation = (cityDetails) => {
	const { lat, lon, address } = cityDetails;
	const { state_district, city, country_code, state } = address;
	const sqlQuery = `INSERT INTO location (city,latitude,longitude,state,country_code) VALUES('${
		'state_district' in address ? state_district : city
	}','${parseFloat(lat).toFixed(6)}','${parseFloat(lon).toFixed(
		6,
	)}','${state}','${country_code}');`;
	return new Promise((resolve, reject) => {
		db.query(sqlQuery, async (err, result) => {
			if (err) return reject(err);
			return resolve(result);
		});
	});
};

//promise to insert post data to location
insertPostNewLocation = (cityDetails) => {
	const { city, state, country_code, latitude, longitude } = cityDetails;
	const sqlQuery = `INSERT INTO location (city,latitude,longitude,state,country_code) VALUES('${city}','${parseFloat(
		latitude,
	).toFixed(6)}','${parseFloat(longitude).toFixed(
		6,
	)}','${state}','${country_code}')`;
	return new Promise((resolve, reject) => {
		db.query(sqlQuery, async (err, result) => {
			if (err) return reject(err);
			return resolve(result);
		});
	});
};

//promise to fetch current data
fetchCurrentData = (insertId) => {
	return new Promise((resolve, reject) => {
		const fetchQuery = `SELECT current_weather.city_id, city , state , timezone ,timezone_offset, country_code , sunrise , sunset , temp ,feels_like , pressure , humidity , visibility , wind_speed ,weather , weather_desc , weather_icon FROM location  JOIN current_weather ON current_weather.city_id = '${insertId}' AND location.city_id='${insertId}'`;

		db.query(fetchQuery, (err, result) => {
			if (err) return reject(err);
			return resolve(result);
		});
	});
};

//promise to insert current data
insertCurrentData = (currentWeatherData, insertId) => {
	const {
		sunrise,
		sunset,
		temp,
		feels_like,
		pressure,
		humidity,
		visibility,
		wind_speed,
		weather: weather_data,
	} = currentWeatherData.current;
	const { timezone, timezone_offset } = currentWeatherData;

	const {
		main: weather,
		description: weather_desc,
		icon: weather_icon,
	} = weather_data[0];

	const insertCurrentQuery = `INSERT INTO current_weather (city_id ,timezone ,timezone_offset, sunrise, 
		sunset ,
		temp ,
		feels_like ,
		pressure ,
		humidity ,
		visibility ,
		wind_speed ,
		weather , 
		weather_desc , 
		weather_icon) VALUES ('${insertId}','${timezone}','${timezone_offset}','${dateTimeConverter(
		sunrise,
	)}','${dateTimeConverter(
		sunset,
	)}',${temp},${feels_like},${pressure},${humidity},${visibility},${wind_speed},'${weather}','${weather_desc}','${weather_icon}')`;
	//sconsole.log(insertCurrentQuery);
	return new Promise((resolve, reject) => {
		db.query(insertCurrentQuery, (err, result) => {
			if (err) return reject(err);
			return resolve(result);
		});
	});
};

//promise to insert daily weather data
insertDailyData = (dailyWeatherData, city_id) => {
	let valueString = [];

	dailyWeatherData.forEach((daily_data) => {
		const {
			dt,
			sunrise,
			sunset,
			moonrise,
			moonset,
			temp,
			feels_like,
			pressure,
			humidity,
			wind_speed,
			weather: weather_data,
		} = daily_data;
		const { min, max } = temp;
		const { day, night } = feels_like;
		const {
			main: weather,
			description: weather_desc,
			icon: weather_icon,
		} = weather_data[0];
		valueString.push(
			`(${city_id},'${dateConverter(dt)}','${dateTimeConverter(
				sunrise,
			)}','${dateTimeConverter(sunset)}','${dateTimeConverter(
				moonrise,
			)}','${dateTimeConverter(
				moonset,
			)}',${min},${max},${day},${night},${pressure},${humidity},${wind_speed},'${weather}','${weather_desc}','${weather_icon}')`,
		);
	});

	const insertDailyQuery = `INSERT INTO daily_weather (city_id , todays_date , sunrise , sunset , moonrise , moonset , min_temp , max_temp , feels_like_day , feels_like_night,pressure , humidity , wind_speed , weather , weather_desc , weather_icon) VALUES ${valueString.join(
		',',
	)} `;
	return new Promise((resolve, reject) => {
		//console.log(insertDailyQuery);
		db.query(insertDailyQuery, (err, result) => {
			if (err) return reject(err);
			return resolve(result);
		});
	});
};

//get request for current weather
app.get('/getcurrent', async (req, res) => {
	// console.log(req.query);
	const { lat: latitude, lon: longitude } = req.query;
	const cityDetails = await fetchCityDetails(latitude, longitude);

	const { lat, lon, address } = cityDetails;
	const { state_district, city } = address;

	const existQuery = `SELECT * FROM location WHERE city = '${
		'state_district' in address ? state_district : city
	}'`;
	db.query(existQuery, async (err, result) => {
		if (result.length === 0) {
			try {
				const { insertId } = await insertNewLocation(cityDetails);
				const currentWeatherData = await fetchWeatherData(lat, lon);

				const { daily } = currentWeatherData;
				await insertCurrentData(currentWeatherData, insertId);
				console.log('inserted to current data successfully');
				await insertDailyData(daily, insertId);
				console.log('inserted to daily data successfully');
				const fetchCurrentResult = await fetchCurrentData(insertId);
				res.status(200).json({ data: fetchCurrentResult });
			} catch (err) {
				res.status(400).json({ error: err });
			}
		} else {
			try {
				const fetchCurrentResult = await fetchCurrentData(result[0].city_id);
				res.status(200).json({ data: fetchCurrentResult });
			} catch (err) {
				res.status(400).json({ error: err });
			}
		}
		if (err) res.status(400).json({ error: err });
	});
});

//post request for current weather
app.post('/getcurrent', async (req, res) => {
	//console.log(req.body);
	// if city exist in db then return that data else fetch using lat and lon and send data.
	const { city, latitude, longitude } = req.body;
	const existQuery = `SELECT * FROM location WHERE city = '${city}'`;
	db.query(existQuery, async (err, result) => {
		if (result.length === 0) {
			try {
				const { insertId } = await insertPostNewLocation(req.body);
				const currentWeatherData = await fetchWeatherData(latitude, longitude);
				const { daily } = currentWeatherData;
				await insertCurrentData(currentWeatherData, insertId);
				await insertDailyData(daily, insertId);
				const fetchCurrentResult = await fetchCurrentData(insertId);
				res.status(200).json({ data: fetchCurrentResult });
			} catch (err) {
				res.status(400).json({ error: err });
			}
		} else {
			try {
				const fetchCurrentResult = await fetchCurrentData(result[0].city_id);
				res.status(200).json({ data: fetchCurrentResult });
			} catch (err) {
				res.status(400).json({ error: err });
			}
		}
		if (err) res.status(400).json({ error: err });
	});
});

//get request for daily weather
app.get('/getdaily', async (req, res) => {
	const { cityid } = req.query;
	try {
		const fetchDailyWeather = await getDailyWeather(cityid);
		res.status(200).json({ data: fetchDailyWeather });
	} catch (err) {
		res.status(400).json({ error: err });
	}
});

app.listen(process.env.PORT || 3001, () => {
	console.log('Server running on port 3001');
});
